import { eq, inArray, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  actes,
  amendements,
  documents,
  dossiers,
  scrutins,
} from "../../db/schema";
import { noterFiches } from "../lib/invalidations";
import {
  DATASETS,
  asArray,
  asDate,
  asInt,
  asText,
  dedoublonnerTitre,
  download,
  forEachZipEntry,
  inBatches,
  logImport,
  upsertSiChange,
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
  const titreBrut = asText(titreDossier.titre);
  const titre = titreBrut ? dedoublonnerTitre(titreBrut) : null;
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

  // Les dossiers 49.3 reprennent des actes de leur projet de loi
  // (ex. PLF 2026) : un même uid deux fois dans un lot fait échouer
  // ON CONFLICT DO UPDATE. On garde la première occurrence.
  const actesByUid = new Map<string, ActeRow>();
  for (const acte of acteRows) {
    if (!actesByUid.has(acte.uid)) actesByUid.set(acte.uid, acte);
  }
  const uniqueActes = [...actesByUid.values()];

  // Le titre d'un dossier s'affiche aussi sur les fiches de ses
  // scrutins (rattachés directement ou par leur amendement) : s'il
  // change, elles sont à relire. Noté avant l'écriture, pour qu'un arrêt
  // en route ne laisse pas d'ancien titre affiché.
  const titresAvant = new Map(
    (
      await db.select({ uid: dossiers.uid, titre: dossiers.titre }).from(dossiers)
    ).map((d) => [d.uid, d.titre]),
  );
  const titresChanges = dossierRows
    .filter((d) => {
      const avant = titresAvant.get(d.uid);
      return avant !== undefined && avant !== d.titre;
    })
    .map((d) => d.uid);
  if (titresChanges.length > 0) {
    const lies = await db
      .select({ uid: scrutins.uid })
      .from(scrutins)
      .leftJoin(amendements, eq(amendements.uid, scrutins.amendementUid))
      .where(
        inArray(
          sql`coalesce(${scrutins.dossierUid}, ${amendements.dossierUid})`,
          titresChanges,
        ),
      );
    await noterFiches(db, { scrutins: lies.map((s) => s.uid) });
  }

  // Chaque lot note, dans la même transaction, les dossiers dont une
  // ligne a réellement été écrite : leurs fiches seront relues.
  await inBatches(dossierRows, 500, async (batch) => {
    await db.transaction(async (tx) => {
      const ecrits = await tx
        .insert(dossiers)
        .values(batch)
        .onConflictDoUpdate({
          target: dossiers.uid,
          ...upsertSiChange(dossiers, [
            "titre",
            "titreChemin",
            "senatChemin",
            "procedureCode",
            "procedureLibelle",
            "typeDossier",
            "initiateurActeurUid",
          ]),
        })
        .returning({ uid: dossiers.uid });
      await noterFiches(tx, { dossiers: ecrits.map((d) => d.uid) });
    });
  });

  // Les actes sont entièrement re-synchronisés dossier par dossier.
  await inBatches(uniqueActes, 1000, async (batch) => {
    await db.transaction(async (tx) => {
      const ecrits = await tx
        .insert(actes)
        .values(batch)
        .onConflictDoUpdate({
          target: actes.uid,
          ...upsertSiChange(actes, [
            "libelle",
            "date",
            "ordre",
            "profondeur",
            "parentUid",
            "organeRef",
            "texteAssocieRef",
            "statut",
            "voteRefs",
          ]),
        })
        .returning({ dossierUid: actes.dossierUid });
      await noterFiches(tx, { dossiers: ecrits.map((a) => a.dossierUid) });
    });
  });

  await inBatches(documentRows, 500, async (batch) => {
    await db.transaction(async (tx) => {
      const ecrits = await tx
        .insert(documents)
        .values(batch)
        .onConflictDoUpdate({
          target: documents.uid,
          ...upsertSiChange(documents, [
            "dossierUid",
            "classeCode",
            "typeCode",
            "sousTypeCode",
            "titre",
            "dateDepot",
            "legislature",
          ]),
        })
        .returning({ dossierUid: documents.dossierUid });
      await noterFiches(tx, { dossiers: ecrits.map((d) => d.dossierUid) });
    });
  });

  const duration = Date.now() - start;
  const total = dossierRows.length + uniqueActes.length + documentRows.length;
  await logImport("dossiers", DATASETS.dossiers.url, total, duration);
  console.log(`Import dossiers terminé en ${Math.round(duration / 1000)}s`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
