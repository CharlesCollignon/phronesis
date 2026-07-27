import { and, eq, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/db";

const { acteurs, mandats, organes } = schema;

export type PositionExprimee = "pour" | "contre" | "abstention";

export type ComparaisonScrutin = {
  scrutinUid: string;
  numero: number;
  dateScrutin: string;
  titre: string;
  positionA: string;
  positionB: string;
  accord: boolean;
};

export type ComparaisonResume = {
  accords: number;
  divergences: number;
  compares: number;
  tauxAccord: number | null;
  nonVotantA: number;
  nonVotantB: number;
  seulementA: number;
  seulementB: number;
};

export type ActeurBref = {
  uid: string;
  prenom: string;
  nom: string;
};

export type GroupeBref = {
  uid: string;
  libelle: string;
  libelleAbrege: string | null;
  couleur: string | null;
};

/** Compare deux députés sur les scrutins publics communs. */
export async function compareDeputes(
  uidA: string,
  uidB: string,
  listLimit = 40,
): Promise<{
  acteurA: ActeurBref;
  acteurB: ActeurBref;
  resume: ComparaisonResume;
  convergences: ComparaisonScrutin[];
  divergences: ComparaisonScrutin[];
} | null> {
  if (uidA === uidB) return null;

  const [acteurA, acteurB] = await Promise.all([
    getActeurBref(uidA),
    getActeurBref(uidB),
  ]);
  if (!acteurA || !acteurB) return null;

  const [resumeRow] = await db.execute<{
    accords: number;
    divergences: number;
    compares: number;
    non_votant_a: number;
    non_votant_b: number;
    seulement_a: number;
    seulement_b: number;
  }>(sql`
    WITH va AS (
      SELECT scrutin_uid, position FROM votes WHERE acteur_uid = ${uidA}
    ),
    vb AS (
      SELECT scrutin_uid, position FROM votes WHERE acteur_uid = ${uidB}
    ),
    joined AS (
      SELECT
        va.scrutin_uid,
        va.position AS pos_a,
        vb.position AS pos_b
      FROM va
      INNER JOIN vb ON vb.scrutin_uid = va.scrutin_uid
    )
    SELECT
      count(*) FILTER (
        WHERE pos_a IN ('pour', 'contre', 'abstention')
          AND pos_b IN ('pour', 'contre', 'abstention')
          AND pos_a = pos_b
      )::int AS accords,
      count(*) FILTER (
        WHERE pos_a IN ('pour', 'contre', 'abstention')
          AND pos_b IN ('pour', 'contre', 'abstention')
          AND pos_a <> pos_b
      )::int AS divergences,
      count(*) FILTER (
        WHERE pos_a IN ('pour', 'contre', 'abstention')
          AND pos_b IN ('pour', 'contre', 'abstention')
      )::int AS compares,
      count(*) FILTER (WHERE pos_a = 'nonVotant')::int AS non_votant_a,
      count(*) FILTER (WHERE pos_b = 'nonVotant')::int AS non_votant_b,
      (
        SELECT count(*)::int FROM va
        WHERE scrutin_uid NOT IN (SELECT scrutin_uid FROM vb)
      ) AS seulement_a,
      (
        SELECT count(*)::int FROM vb
        WHERE scrutin_uid NOT IN (SELECT scrutin_uid FROM va)
      ) AS seulement_b
    FROM joined
  `);

  const compares = Number(resumeRow?.compares ?? 0);
  const accords = Number(resumeRow?.accords ?? 0);
  const divergences = Number(resumeRow?.divergences ?? 0);

  const resume: ComparaisonResume = {
    accords,
    divergences,
    compares,
    tauxAccord: compares > 0 ? accords / compares : null,
    nonVotantA: Number(resumeRow?.non_votant_a ?? 0),
    nonVotantB: Number(resumeRow?.non_votant_b ?? 0),
    seulementA: Number(resumeRow?.seulement_a ?? 0),
    seulementB: Number(resumeRow?.seulement_b ?? 0),
  };

  const [convergences, divergencesList] = await Promise.all([
    listScrutinsComparaison(uidA, uidB, true, listLimit),
    listScrutinsComparaison(uidA, uidB, false, listLimit),
  ]);

  return {
    acteurA,
    acteurB,
    resume,
    convergences,
    divergences: divergencesList,
  };
}

async function listScrutinsComparaison(
  uidA: string,
  uidB: string,
  accord: boolean,
  limit: number,
): Promise<ComparaisonScrutin[]> {
  const accordClause = accord
    ? sql`va.position = vb.position`
    : sql`va.position <> vb.position`;
  const rows = await db.execute<{
    scrutin_uid: string;
    numero: number;
    date_scrutin: string;
    titre: string;
    pos_a: string;
    pos_b: string;
  }>(sql`
    SELECT
      s.uid AS scrutin_uid,
      s.numero,
      s.date_scrutin,
      s.titre,
      va.position AS pos_a,
      vb.position AS pos_b
    FROM votes va
    INNER JOIN votes vb
      ON vb.scrutin_uid = va.scrutin_uid
     AND vb.acteur_uid = ${uidB}
    INNER JOIN scrutins s ON s.uid = va.scrutin_uid
    WHERE va.acteur_uid = ${uidA}
      AND va.position IN ('pour', 'contre', 'abstention')
      AND vb.position IN ('pour', 'contre', 'abstention')
      AND ${accordClause}
    ORDER BY s.date_scrutin DESC, s.numero DESC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    scrutinUid: r.scrutin_uid,
    numero: r.numero,
    dateScrutin: r.date_scrutin,
    titre: r.titre,
    positionA: r.pos_a,
    positionB: r.pos_b,
    accord,
  }));
}

/** Position majoritaire d'un groupe par scrutin, puis comparaison. */
export async function compareGroupes(
  organeUidA: string,
  organeUidB: string,
  listLimit = 40,
): Promise<{
  groupeA: GroupeBref;
  groupeB: GroupeBref;
  resume: ComparaisonResume;
  convergences: ComparaisonScrutin[];
  divergences: ComparaisonScrutin[];
} | null> {
  if (organeUidA === organeUidB) return null;

  const [groupeA, groupeB] = await Promise.all([
    getGroupeBref(organeUidA),
    getGroupeBref(organeUidB),
  ]);
  if (!groupeA || !groupeB) return null;

  const [resumeRow] = await db.execute<{
    accords: number;
    divergences: number;
    compares: number;
  }>(sql`
    WITH maj_a AS (
      SELECT
        scrutin_uid,
        mode() WITHIN GROUP (ORDER BY position) AS pos
      FROM votes
      WHERE groupe_uid = ${organeUidA}
        AND position IN ('pour', 'contre', 'abstention')
      GROUP BY scrutin_uid
    ),
    maj_b AS (
      SELECT
        scrutin_uid,
        mode() WITHIN GROUP (ORDER BY position) AS pos
      FROM votes
      WHERE groupe_uid = ${organeUidB}
        AND position IN ('pour', 'contre', 'abstention')
      GROUP BY scrutin_uid
    ),
    joined AS (
      SELECT a.scrutin_uid, a.pos AS pos_a, b.pos AS pos_b
      FROM maj_a a
      INNER JOIN maj_b b ON b.scrutin_uid = a.scrutin_uid
    )
    SELECT
      count(*) FILTER (WHERE pos_a = pos_b)::int AS accords,
      count(*) FILTER (WHERE pos_a <> pos_b)::int AS divergences,
      count(*)::int AS compares
    FROM joined
  `);

  const compares = Number(resumeRow?.compares ?? 0);
  const accords = Number(resumeRow?.accords ?? 0);
  const divergences = Number(resumeRow?.divergences ?? 0);

  const resume: ComparaisonResume = {
    accords,
    divergences,
    compares,
    tauxAccord: compares > 0 ? accords / compares : null,
    nonVotantA: 0,
    nonVotantB: 0,
    seulementA: 0,
    seulementB: 0,
  };

  const detailRows = await db.execute<{
    scrutin_uid: string;
    numero: number;
    date_scrutin: string;
    titre: string;
    pos_a: string;
    pos_b: string;
  }>(sql`
    WITH maj_a AS (
      SELECT
        scrutin_uid,
        mode() WITHIN GROUP (ORDER BY position) AS pos
      FROM votes
      WHERE groupe_uid = ${organeUidA}
        AND position IN ('pour', 'contre', 'abstention')
      GROUP BY scrutin_uid
    ),
    maj_b AS (
      SELECT
        scrutin_uid,
        mode() WITHIN GROUP (ORDER BY position) AS pos
      FROM votes
      WHERE groupe_uid = ${organeUidB}
        AND position IN ('pour', 'contre', 'abstention')
      GROUP BY scrutin_uid
    )
    SELECT
      s.uid AS scrutin_uid,
      s.numero,
      s.date_scrutin,
      s.titre,
      a.pos AS pos_a,
      b.pos AS pos_b
    FROM maj_a a
    INNER JOIN maj_b b ON b.scrutin_uid = a.scrutin_uid
    INNER JOIN scrutins s ON s.uid = a.scrutin_uid
    ORDER BY s.date_scrutin DESC, s.numero DESC
  `);

  const convergences: ComparaisonScrutin[] = [];
  const divergencesList: ComparaisonScrutin[] = [];
  for (const r of detailRows) {
    const item: ComparaisonScrutin = {
      scrutinUid: r.scrutin_uid,
      numero: r.numero,
      dateScrutin: r.date_scrutin,
      titre: r.titre,
      positionA: r.pos_a,
      positionB: r.pos_b,
      accord: r.pos_a === r.pos_b,
    };
    if (item.accord) convergences.push(item);
    else divergencesList.push(item);
  }

  return {
    groupeA,
    groupeB,
    resume,
    convergences: convergences.slice(0, listLimit),
    divergences: divergencesList.slice(0, listLimit),
  };
}

async function getActeurBref(uid: string): Promise<ActeurBref | null> {
  const [row] = await db
    .select({
      uid: acteurs.uid,
      prenom: acteurs.prenom,
      nom: acteurs.nom,
    })
    .from(acteurs)
    .where(eq(acteurs.uid, uid))
    .limit(1);
  return row ?? null;
}

async function getGroupeBref(uid: string): Promise<GroupeBref | null> {
  const [row] = await db
    .select({
      uid: organes.uid,
      libelle: organes.libelle,
      libelleAbrege: organes.libelleAbrege,
      couleur: organes.couleur,
    })
    .from(organes)
    .where(eq(organes.uid, uid))
    .limit(1);
  return row ?? null;
}

/** Groupes parlementaires actifs (AN ou Sénat). */
export async function listGroupesLegislature(
  chambre: "AN" | "SENAT" = "AN",
): Promise<GroupeBref[]> {
  const codeType = chambre === "SENAT" ? "GROUPESENAT" : "GP";
  const rows = await db
    .selectDistinctOn([organes.uid], {
      uid: organes.uid,
      libelle: organes.libelle,
      libelleAbrege: organes.libelleAbrege,
      couleur: organes.couleur,
    })
    .from(organes)
    .innerJoin(mandats, eq(mandats.organeUid, organes.uid))
    .where(
      and(
        eq(organes.codeType, codeType),
        eq(mandats.codeTypeOrgane, codeType),
        isNull(mandats.dateFin),
      ),
    )
    .orderBy(organes.uid);

  return [...rows].sort((a, b) =>
    a.libelle.localeCompare(b.libelle, "fr"),
  );
}

async function searchParlementaires(
  codeTypeOrgane: "ASSEMBLEE" | "SENAT",
  q: string,
  limit: number,
  requireLeg17: boolean,
): Promise<ActeurBref[]> {
  const query = q.trim();
  const baseJoin = and(
    eq(mandats.acteurUid, acteurs.uid),
    eq(mandats.codeTypeOrgane, codeTypeOrgane),
    isNull(mandats.dateFin),
    requireLeg17 ? eq(mandats.legislature, 17) : sql`true`,
  );

  if (!query) {
    return db
      .select({
        uid: acteurs.uid,
        prenom: acteurs.prenom,
        nom: acteurs.nom,
      })
      .from(acteurs)
      .innerJoin(mandats, baseJoin)
      .orderBy(acteurs.nom, acteurs.prenom)
      .limit(limit);
  }

  return db
    .select({
      uid: acteurs.uid,
      prenom: acteurs.prenom,
      nom: acteurs.nom,
    })
    .from(acteurs)
    .innerJoin(mandats, baseJoin)
    .where(
      sql`(${acteurs.nom} ILIKE ${"%" + query + "%"}
        OR ${acteurs.prenom} ILIKE ${"%" + query + "%"}
        OR ${acteurs.searchVector} @@ plainto_tsquery('french', ${query}))`,
    )
    .orderBy(acteurs.nom, acteurs.prenom)
    .limit(limit);
}

/** Recherche légère de députés pour le sélecteur du comparateur. */
export async function searchDeputesPourComparateur(
  q: string,
  limit = 20,
): Promise<ActeurBref[]> {
  return searchParlementaires("ASSEMBLEE", q, limit, true);
}

export async function searchSenateursPourComparateur(
  q: string,
  limit = 20,
): Promise<ActeurBref[]> {
  return searchParlementaires("SENAT", q, limit, false);
}
