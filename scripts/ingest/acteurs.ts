import { sql } from "drizzle-orm";

import { db } from "../../db";
import { acteurs, mandats, organes } from "../../db/schema";
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

type OrganeRow = typeof organes.$inferInsert;
type ActeurRow = typeof acteurs.$inferInsert;
type MandatRow = typeof mandats.$inferInsert;

function parseOrgane(raw: Json): OrganeRow | null {
  const o = raw.organe as Json | undefined;
  if (!o) return null;
  const uid = asText(o.uid);
  const codeType = asText(o.codeType);
  const libelle = asText(o.libelle);
  if (!uid || !codeType || !libelle) return null;
  const viMoDe = (o.viMoDe ?? {}) as Json;
  return {
    uid,
    codeType,
    libelle,
    libelleAbrege: asText(o.libelleAbrege),
    couleur: asText(o.couleurAssociee),
    positionPolitique: asText(o.positionPolitique),
    dateDebut: asDate(viMoDe.dateDebut),
    dateFin: asDate(viMoDe.dateFin),
    legislature: asInt(o.legislature),
  };
}

function parseActeur(
  raw: Json,
): { acteur: ActeurRow; mandats: MandatRow[] } | null {
  const a = raw.acteur as Json | undefined;
  if (!a) return null;
  const uid = asText(a.uid);
  if (!uid) return null;
  const etatCivil = (a.etatCivil ?? {}) as Json;
  const ident = (etatCivil.ident ?? {}) as Json;
  const naissance = (etatCivil.infoNaissance ?? {}) as Json;
  const profession = (a.profession ?? {}) as Json;
  const prenom = asText(ident.prenom);
  const nom = asText(ident.nom);
  if (!prenom || !nom) return null;

  const acteur: ActeurRow = {
    uid,
    civilite: asText(ident.civ),
    prenom,
    nom,
    dateNaissance: asDate(naissance.dateNais),
    villeNaissance: asText(naissance.villeNais),
    profession: asText(profession.libelleCourant),
  };

  const mandatRows: MandatRow[] = [];
  const mandatList = asArray(((a.mandats ?? {}) as Json).mandat) as Json[];
  for (const m of mandatList) {
    const mandatUid = asText(m.uid);
    const codeTypeOrgane = asText(m.typeOrgane);
    if (!mandatUid || !codeTypeOrgane) continue;
    const infosQualite = (m.infosQualite ?? {}) as Json;
    const organeRefs = asArray(((m.organes ?? {}) as Json).organeRef)
      .map((r) => asText(r))
      .filter((r): r is string => r != null);
    const election = (m.election ?? {}) as Json;
    const lieu = (election.lieu ?? {}) as Json;
    mandatRows.push({
      uid: mandatUid,
      acteurUid: uid,
      organeUid: organeRefs[0] ?? null,
      codeTypeOrgane,
      libelleQualite: asText(infosQualite.libQualite),
      dateDebut: asDate(m.dateDebut),
      dateFin: asDate(m.dateFin),
      legislature: asInt(m.legislature),
      circoDepartement: asText(lieu.departement),
      circoNumDepartement: asText(lieu.numDepartement),
      circoNum: asText(lieu.numCirco),
    });
  }
  return { acteur, mandats: mandatRows };
}

async function main(): Promise<void> {
  const start = Date.now();
  const zipPath = await download(DATASETS.acteurs);

  const organeRows: OrganeRow[] = [];
  const acteurRows: ActeurRow[] = [];
  const mandatRows: MandatRow[] = [];

  await forEachZipEntry(
    zipPath,
    (p) => p.endsWith(".json"),
    (p, content) => {
      const raw = JSON.parse(content) as Json;
      if (p.includes("/organe/")) {
        const row = parseOrgane(raw);
        if (row) organeRows.push(row);
      } else if (p.includes("/acteur/")) {
        const parsed = parseActeur(raw);
        if (parsed) {
          acteurRows.push(parsed.acteur);
          mandatRows.push(...parsed.mandats);
        }
      }
    },
  );

  console.log(
    `Parsé : ${organeRows.length} organes, ${acteurRows.length} acteurs, ` +
      `${mandatRows.length} mandats`,
  );

  // Neutralise les références vers des organes absents du dump (FK).
  const organeUids = new Set(organeRows.map((o) => o.uid));
  for (const m of mandatRows) {
    if (m.organeUid && !organeUids.has(m.organeUid)) m.organeUid = null;
  }

  await inBatches(organeRows, 500, async (batch) => {
    await db
      .insert(organes)
      .values(batch)
      .onConflictDoUpdate({
        target: organes.uid,
        set: {
          codeType: sqlExcluded("code_type"),
          libelle: sqlExcluded("libelle"),
          libelleAbrege: sqlExcluded("libelle_abrege"),
          couleur: sqlExcluded("couleur"),
          positionPolitique: sqlExcluded("position_politique"),
          dateDebut: sqlExcluded("date_debut"),
          dateFin: sqlExcluded("date_fin"),
          legislature: sqlExcluded("legislature"),
        },
      });
  });

  await inBatches(acteurRows, 500, async (batch) => {
    await db
      .insert(acteurs)
      .values(batch)
      .onConflictDoUpdate({
        target: acteurs.uid,
        set: {
          civilite: sqlExcluded("civilite"),
          prenom: sqlExcluded("prenom"),
          nom: sqlExcluded("nom"),
          dateNaissance: sqlExcluded("date_naissance"),
          villeNaissance: sqlExcluded("ville_naissance"),
          profession: sqlExcluded("profession"),
        },
      });
  });

  await inBatches(mandatRows, 500, async (batch) => {
    await db
      .insert(mandats)
      .values(batch)
      .onConflictDoUpdate({
        target: mandats.uid,
        set: {
          organeUid: sqlExcluded("organe_uid"),
          libelleQualite: sqlExcluded("libelle_qualite"),
          dateDebut: sqlExcluded("date_debut"),
          dateFin: sqlExcluded("date_fin"),
          circoDepartement: sqlExcluded("circo_departement"),
          circoNumDepartement: sqlExcluded("circo_num_departement"),
          circoNum: sqlExcluded("circo_num"),
        },
      });
  });

  const duration = Date.now() - start;
  const total = organeRows.length + acteurRows.length + mandatRows.length;
  await logImport("acteurs", DATASETS.acteurs.url, total, duration);
  console.log(`Import acteurs terminé en ${Math.round(duration / 1000)}s`);
  process.exit(0);
}

function sqlExcluded(column: string): ReturnType<typeof sql> {
  return sql.raw(`excluded."${column}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
