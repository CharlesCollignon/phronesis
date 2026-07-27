import { sql } from "drizzle-orm";

import { db } from "../../db";
import { actes, documents, dossiers } from "../../db/schema";
import {
  DATASETS,
  asArray,
  asDate,
  asInt,
  asText,
  download,
  forEachZipEntry,
  inBatches,
  logImport,
} from "./lib";

type Json = Record<string, unknown>;

type DossierRow = typeof dossiers.$inferInsert;
type ActeRow = typeof actes.$inferInsert;
type DocumentRow = typeof documents.$inferInsert;

function flattenActes(
  node: unknown,
  dossierUid: string,
  parentUid: string | null,
  profondeur: number,
  ordreRef: { n: number },
  out: ActeRow[],
): void {
  for (const acte of asArray(node) as Json[]) {
    const uid = asText(acte.uid);
    const code = asText(acte.codeActe);
    if (!uid || !code) continue;
    const libelleActe = (acte.libelleActe ?? {}) as Json;
    const statutConclusion = (acte.statutConclusion ?? {}) as Json;
    const voteRefs = asArray(((acte.voteRefs ?? {}) as Json).voteRef)
      .map((v) => asText(v))
      .filter((v): v is string => v != null);
    const textesAssocies = asArray(
      ((acte.textesAssocies ?? {}) as Json).texteAssocie,
    ) as Json[];
    const texteAssocie =
      asText(acte.texteAssocie) ??
      asText(acte.texteAdopte) ??
      (textesAssocies[0] ? asText(textesAssocies[0].refTexteAssocie) : null);
    out.push({
      uid,
      dossierUid,
      code,
      libelle: asText(libelleActe.nomCanonique) ?? asText(libelleActe.libelleCourt),
      date: asDate(acte.dateActe),
      ordre: ordreRef.n++,
      profondeur,
      parentUid,
      organeRef: asText(acte.organeRef),
      texteAssocieRef: texteAssocie,
      statut: asText(statutConclusion.libelle),
      voteRefs: voteRefs.length > 0 ? voteRefs : null,
    });
    const children = (acte.actesLegislatifs ?? {}) as Json;
    if (children && children.acteLegislatif) {
      flattenActes(
        children.acteLegislatif,
        dossierUid,
        uid,
        profondeur + 1,
        ordreRef,
        out,
      );
    }
  }
}

function parseDossier(
  raw: Json,
): { dossier: DossierRow; actes: ActeRow[] } | null {
  const d = raw.dossierParlementaire as Json | undefined;
  if (!d) return null;
  const uid = asText(d.uid);
  const legislature = asInt(d.legislature);
  const titreDossier = (d.titreDossier ?? {}) as Json;
  const titre = asText(titreDossier.titre);
  if (!uid || !legislature || !titre) return null;
  const procedure = (d.procedureParlementaire ?? {}) as Json;
  const initiateur = (d.initiateur ?? {}) as Json;
  const initiateurActeur = asArray(
    ((initiateur.acteurs ?? {}) as Json).acteur,
  )[0] as Json | undefined;

  const dossier: DossierRow = {
    uid,
    legislature,
    titre,
    titreChemin: asText(titreDossier.titreChemin),
    senatChemin: asText(titreDossier.senatChemin),
    procedureCode: asText(procedure.code),
    procedureLibelle: asText(procedure.libelle),
    typeDossier: asText(d["@xsi:type"]),
    initiateurActeurUid: initiateurActeur
      ? asText(initiateurActeur.acteurRef)
      : null,
  };

  const acteRows: ActeRow[] = [];
  const actesLegislatifs = (d.actesLegislatifs ?? {}) as Json;
  if (actesLegislatifs.acteLegislatif) {
    flattenActes(
      actesLegislatifs.acteLegislatif,
      uid,
      null,
      0,
      { n: 0 },
      acteRows,
    );
  }
  return { dossier, actes: acteRows };
}

function parseDocument(raw: Json): DocumentRow | null {
  const doc = raw.document as Json | undefined;
  if (!doc) return null;
  const uid = asText(doc.uid);
  const titres = (doc.titres ?? {}) as Json;
  const titre = asText(titres.titrePrincipal);
  if (!uid || !titre) return null;
  const chrono = (((doc.cycleDeVie ?? {}) as Json).chrono ?? {}) as Json;
  const classification = (doc.classification ?? {}) as Json;
  const famille = (classification.famille ?? {}) as Json;
  const classe = (famille.classe ?? {}) as Json;
  const type = (classification.type ?? {}) as Json;
  const sousType = (classification.sousType ?? {}) as Json;
  return {
    uid,
    dossierUid: asText(doc.dossierRef),
    classeCode: asText(classe.code),
    typeCode: asText(type.code),
    sousTypeCode: asText(sousType.code),
    titre,
    dateDepot: asDate(chrono.dateDepot),
    legislature: asInt(doc.legislature),
  };
}

function sqlExcluded(column: string): ReturnType<typeof sql> {
  return sql.raw(`excluded."${column}"`);
}

async function main(): Promise<void> {
  const start = Date.now();
  const zipPath = await download(DATASETS.dossiers);

  const dossierRows: DossierRow[] = [];
  const acteRows: ActeRow[] = [];
  const documentRows: DocumentRow[] = [];

  await forEachZipEntry(
    zipPath,
    (p) => p.endsWith(".json"),
    (p, content) => {
      const raw = JSON.parse(content) as Json;
      if (p.includes("/dossierParlementaire/")) {
        const parsed = parseDossier(raw);
        if (parsed) {
          dossierRows.push(parsed.dossier);
          acteRows.push(...parsed.actes);
        }
      } else if (p.includes("/document/")) {
        const row = parseDocument(raw);
        if (row) documentRows.push(row);
      }
    },
  );

  console.log(
    `Parsé : ${dossierRows.length} dossiers, ${acteRows.length} actes, ` +
      `${documentRows.length} documents`,
  );

  // Neutralise les FK vers des dossiers hors du dump (ex. législatures
  // antérieures référencées par des documents en navette).
  const dossierUids = new Set(dossierRows.map((d) => d.uid));
  for (const doc of documentRows) {
    if (doc.dossierUid && !dossierUids.has(doc.dossierUid)) {
      doc.dossierUid = null;
    }
  }

  await inBatches(dossierRows, 500, async (batch) => {
    await db
      .insert(dossiers)
      .values(batch)
      .onConflictDoUpdate({
        target: dossiers.uid,
        set: {
          titre: sqlExcluded("titre"),
          titreChemin: sqlExcluded("titre_chemin"),
          senatChemin: sqlExcluded("senat_chemin"),
          procedureCode: sqlExcluded("procedure_code"),
          procedureLibelle: sqlExcluded("procedure_libelle"),
          typeDossier: sqlExcluded("type_dossier"),
          initiateurActeurUid: sqlExcluded("initiateur_acteur_uid"),
        },
      });
  });

  // Les actes sont entièrement re-synchronisés dossier par dossier.
  await inBatches(acteRows, 1000, async (batch) => {
    await db
      .insert(actes)
      .values(batch)
      .onConflictDoUpdate({
        target: actes.uid,
        set: {
          libelle: sqlExcluded("libelle"),
          date: sqlExcluded("date"),
          ordre: sqlExcluded("ordre"),
          profondeur: sqlExcluded("profondeur"),
          parentUid: sqlExcluded("parent_uid"),
          organeRef: sqlExcluded("organe_ref"),
          texteAssocieRef: sqlExcluded("texte_associe_ref"),
          statut: sqlExcluded("statut"),
          voteRefs: sqlExcluded("vote_refs"),
        },
      });
  });

  await inBatches(documentRows, 500, async (batch) => {
    await db
      .insert(documents)
      .values(batch)
      .onConflictDoUpdate({
        target: documents.uid,
        set: {
          dossierUid: sqlExcluded("dossier_uid"),
          classeCode: sqlExcluded("classe_code"),
          typeCode: sqlExcluded("type_code"),
          sousTypeCode: sqlExcluded("sous_type_code"),
          titre: sqlExcluded("titre"),
          dateDepot: sqlExcluded("date_depot"),
          legislature: sqlExcluded("legislature"),
        },
      });
  });

  const duration = Date.now() - start;
  const total = dossierRows.length + acteRows.length + documentRows.length;
  await logImport("dossiers", DATASETS.dossiers.url, total, duration);
  console.log(`Import dossiers terminé en ${Math.round(duration / 1000)}s`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
