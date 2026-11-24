import { db } from "../../db";
import { acteurs, mandats, organes } from "../../db/schema";
import { noterToutesLesFiches } from "../lib/invalidations";
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
  upsertSiChange,
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

/** Organes dont le libellé s'affiche sur les fiches scrutin. */
const GROUPES_POLITIQUES = new Set(["GP", "GROUPESENAT"]);

/**
 * Vrai si le nom d'un élu ou le libellé d'un groupe déjà en base change
 * avec ce dump. Ils s'affichent sur la plupart des fiches scrutin
 * (votants, groupes, auteur de l'amendement), qui sont alors toutes à
 * relire. Un nouvel élu ou un nouveau groupe ne compte pas : aucune
 * fiche en cache ne l'affiche encore.
 */
async function libellesAffichesChangent(
  acteurRows: ActeurRow[],
  organeRows: OrganeRow[],
): Promise<boolean> {
  const nomsAvant = new Map(
    (
      await db
        .select({ uid: acteurs.uid, prenom: acteurs.prenom, nom: acteurs.nom })
        .from(acteurs)
    ).map((a) => [a.uid, JSON.stringify([a.prenom, a.nom])]),
  );
  const acteurChange = acteurRows.some((a) => {
    const avant = nomsAvant.get(a.uid);
    return avant !== undefined && avant !== JSON.stringify([a.prenom, a.nom]);
  });
  if (acteurChange) return true;

  const groupesAvant = new Map(
    (
      await db
        .select({
          uid: organes.uid,
          codeType: organes.codeType,
          libelle: organes.libelle,
          libelleAbrege: organes.libelleAbrege,
          couleur: organes.couleur,
        })
        .from(organes)
    )
      .filter((o) => GROUPES_POLITIQUES.has(o.codeType))
      .map((o) => [
        o.uid,
        JSON.stringify([o.libelle, o.libelleAbrege, o.couleur]),
      ]),
  );
  return organeRows.some((o) => {
    const avant = groupesAvant.get(o.uid);
    return (
      avant !== undefined &&
      avant !==
        JSON.stringify([o.libelle, o.libelleAbrege ?? null, o.couleur ?? null])
    );
  });
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

  // Noté avant l'écriture : si le script s'arrête en route, les fiches
  // sont relues pour rien, jamais laissées avec un ancien nom.
  if (await libellesAffichesChangent(acteurRows, organeRows)) {
    console.log(
      "Nom d'élu ou libellé de groupe modifié : toutes les fiches seront relues",
    );
    await noterToutesLesFiches(db);
  }

  await inBatches(organeRows, 500, async (batch) => {
    await db
      .insert(organes)
      .values(batch)
      .onConflictDoUpdate({
        target: organes.uid,
        ...upsertSiChange(organes, [
          "codeType",
          "libelle",
          "libelleAbrege",
          "couleur",
          "positionPolitique",
          "dateDebut",
          "dateFin",
          "legislature",
        ]),
      });
  });

  await inBatches(acteurRows, 500, async (batch) => {
    await db
      .insert(acteurs)
      .values(batch)
      .onConflictDoUpdate({
        target: acteurs.uid,
        ...upsertSiChange(acteurs, [
          "civilite",
          "prenom",
          "nom",
          "dateNaissance",
          "villeNaissance",
          "profession",
        ]),
      });
  });

  await inBatches(mandatRows, 500, async (batch) => {
    await db
      .insert(mandats)
      .values(batch)
      .onConflictDoUpdate({
        target: mandats.uid,
        ...upsertSiChange(mandats, [
          "organeUid",
          "libelleQualite",
          "dateDebut",
          "dateFin",
          "circoDepartement",
          "circoNumDepartement",
          "circoNum",
        ]),
      });
  });

  const duration = Date.now() - start;
  const total = organeRows.length + acteurRows.length + mandatRows.length;
  await logImport("acteurs", DATASETS.acteurs.url, total, duration);
  console.log(`Import acteurs terminé en ${Math.round(duration / 1000)}s`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
