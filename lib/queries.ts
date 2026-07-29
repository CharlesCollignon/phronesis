import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { computeScorePhronesis } from "@/lib/score-phronesis";

const {
  acteurs,
  acteurHatvp,
  actes,
  amendements,
  documents,
  dossiers,
  empreintes,
  faitsJudiciairesPublics,
  imports,
  mandats,
  organes,
  resumesIa,
  scrutins,
  votes,
} = schema;

export type DeputeListItem = {
  uid: string;
  prenom: string;
  nom: string;
  civilite: string | null;
  senatMatricule: string | null;
  groupeUid: string | null;
  groupeLibelle: string | null;
  groupeAbrege: string | null;
  groupeCouleur: string | null;
  circoDepartement: string | null;
  circoNum: string | null;
};

async function listParlementaires(
  chambreOrgane: "ASSEMBLEE" | "SENAT",
  groupeOrgane: "GP" | "GROUPESENAT",
  search?: string,
  requireLegislature17 = false,
): Promise<DeputeListItem[]> {
  const q = search?.trim() ?? "";
  const rows = await db.execute<DeputeListItem>(sql`
    SELECT DISTINCT ON (a.uid)
      a.uid,
      a.prenom,
      a.nom,
      a.civilite,
      a.senat_matricule AS "senatMatricule",
      o.uid AS "groupeUid",
      o.libelle AS "groupeLibelle",
      o.libelle_abrege AS "groupeAbrege",
      o.couleur AS "groupeCouleur",
      ma.circo_departement AS "circoDepartement",
      ma.circo_num AS "circoNum"
    FROM acteurs a
    INNER JOIN mandats ma
      ON ma.acteur_uid = a.uid
     AND ma.code_type_organe = ${chambreOrgane}
     AND ma.date_fin IS NULL
     ${
       requireLegislature17
         ? sql`AND ma.legislature = 17`
         : sql``
     }
    LEFT JOIN mandats mg
      ON mg.acteur_uid = a.uid
     AND mg.code_type_organe = ${groupeOrgane}
     AND mg.date_fin IS NULL
    LEFT JOIN organes o ON o.uid = mg.organe_uid
    WHERE (
      ${q} = ''
      OR a.search_vector @@ plainto_tsquery('french', ${q})
      OR a.nom ILIKE ${"%" + q + "%"}
      OR a.prenom ILIKE ${"%" + q + "%"}
    )
    ORDER BY a.uid, mg.date_debut DESC NULLS LAST
  `);

  return [...rows].sort(
    (a, b) =>
      a.nom.localeCompare(b.nom, "fr") ||
      a.prenom.localeCompare(b.prenom, "fr"),
  );
}

/** Députés de la 17e législature (mandat ASSEMBLEE). */
export async function listDeputes(
  search?: string,
): Promise<DeputeListItem[]> {
  return listParlementaires("ASSEMBLEE", "GP", search, true);
}

/** Sénateurs en mandat (AMO + groupes Sénat). */
export async function listSenateurs(
  search?: string,
): Promise<DeputeListItem[]> {
  return listParlementaires("SENAT", "GROUPESENAT", search, false);
}

async function getParlementaire(
  uid: string,
  chambreOrgane: "ASSEMBLEE" | "SENAT",
  groupeOrgane: "GP" | "GROUPESENAT",
) {
  const [acteur] = await db
    .select()
    .from(acteurs)
    .where(eq(acteurs.uid, uid))
    .limit(1);
  if (!acteur) return null;

  const mandatRows = await db
    .select()
    .from(mandats)
    .where(
      and(
        eq(mandats.acteurUid, uid),
        eq(mandats.codeTypeOrgane, chambreOrgane),
        isNull(mandats.dateFin),
      ),
    )
    .limit(1);

  const groupe = await db
    .select({
      uid: organes.uid,
      libelle: organes.libelle,
      libelleAbrege: organes.libelleAbrege,
      couleur: organes.couleur,
    })
    .from(mandats)
    .innerJoin(organes, eq(organes.uid, mandats.organeUid))
    .where(
      and(
        eq(mandats.acteurUid, uid),
        eq(mandats.codeTypeOrgane, groupeOrgane),
        isNull(mandats.dateFin),
      ),
    )
    .limit(1);

  return {
    acteur,
    mandat: mandatRows[0] ?? null,
    groupe: groupe[0] ?? null,
  };
}

/** HATVP + décisions définitives curatées pour une fiche acteur. */
export async function getActeurTransparence(uid: string): Promise<{
  hatvp: {
    hatvpUrl: string;
    qualite: string;
  } | null;
  faits: {
    id: number;
    dateDecision: string | null;
    juridiction: string | null;
    resume: string;
    sourceUrl: string;
    sourceLabel: string;
  }[];
}> {
  const [hatvpRow] = await db
    .select({
      hatvpUrl: acteurHatvp.hatvpUrl,
      qualite: acteurHatvp.qualite,
    })
    .from(acteurHatvp)
    .where(eq(acteurHatvp.acteurUid, uid))
    .limit(1);

  const faits = await db
    .select({
      id: faitsJudiciairesPublics.id,
      dateDecision: faitsJudiciairesPublics.dateDecision,
      juridiction: faitsJudiciairesPublics.juridiction,
      resume: faitsJudiciairesPublics.resume,
      sourceUrl: faitsJudiciairesPublics.sourceUrl,
      sourceLabel: faitsJudiciairesPublics.sourceLabel,
    })
    .from(faitsJudiciairesPublics)
    .where(eq(faitsJudiciairesPublics.acteurUid, uid))
    .orderBy(desc(faitsJudiciairesPublics.dateDecision));

  return {
    hatvp: hatvpRow ?? null,
    faits,
  };
}

export async function getDepute(uid: string) {
  return getParlementaire(uid, "ASSEMBLEE", "GP");
}

export async function getSenateur(uid: string) {
  return getParlementaire(uid, "SENAT", "GROUPESENAT");
}

export async function getDeputeStats(uid: string) {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pour: sql<number>`count(*) FILTER (WHERE ${votes.position} = 'pour')::int`,
      contre: sql<number>`count(*) FILTER (WHERE ${votes.position} = 'contre')::int`,
      abstention: sql<number>`count(*) FILTER (WHERE ${votes.position} = 'abstention')::int`,
      nonVotant: sql<number>`count(*) FILTER (WHERE ${votes.position} = 'nonVotant')::int`,
    })
    .from(votes)
    .where(eq(votes.acteurUid, uid));

  const [fidelite] = await db.execute<{
    accords: number;
    compares: number;
  }>(sql`
    WITH mon_groupe AS (
      SELECT v.scrutin_uid, v.groupe_uid, v.position AS ma_pos
      FROM votes v
      WHERE v.acteur_uid = ${uid}
        AND v.groupe_uid IS NOT NULL
        AND v.position IN ('pour', 'contre', 'abstention')
    ),
    maj AS (
      SELECT
        mg.scrutin_uid,
        mg.ma_pos,
        mode() WITHIN GROUP (ORDER BY v.position) AS groupe_pos
      FROM mon_groupe mg
      JOIN votes v
        ON v.scrutin_uid = mg.scrutin_uid
       AND v.groupe_uid = mg.groupe_uid
       AND v.position IN ('pour', 'contre', 'abstention')
      GROUP BY mg.scrutin_uid, mg.ma_pos
    )
    SELECT
      count(*) FILTER (WHERE ma_pos = groupe_pos)::int AS accords,
      count(*)::int AS compares
    FROM maj
  `);

  const [amd] = await db
    .select({
      deposes: sql<number>`count(*)::int`,
      adoptes: sql<number>`count(*) FILTER (
        WHERE lower(coalesce(${amendements.sort}, '')) LIKE '%adopt%'
      )::int`,
    })
    .from(amendements)
    .where(eq(amendements.auteurActeurUid, uid));

  const total = totals?.total ?? 0;
  const nonVotant = totals?.nonVotant ?? 0;
  const participation = total > 0 ? total - nonVotant : 0;
  const compares = Number(fidelite?.compares ?? 0);
  const accords = Number(fidelite?.accords ?? 0);

  return {
    totalVotes: total,
    pour: totals?.pour ?? 0,
    contre: totals?.contre ?? 0,
    abstention: totals?.abstention ?? 0,
    nonVotant,
    participation,
    tauxParticipation: total > 0 ? participation / total : null,
    fideliteGroupe: compares > 0 ? accords / compares : null,
    fideliteCompares: compares,
    amendementsDeposes: amd?.deposes ?? 0,
    amendementsAdoptes: amd?.adoptes ?? 0,
  };
}

export async function getDeputeVotes(uid: string, limit = 50) {
  return db
    .select({
      scrutinUid: scrutins.uid,
      numero: scrutins.numero,
      dateScrutin: scrutins.dateScrutin,
      titre: scrutins.titre,
      sortCode: scrutins.sortCode,
      position: votes.position,
      parDelegation: votes.parDelegation,
    })
    .from(votes)
    .innerJoin(scrutins, eq(scrutins.uid, votes.scrutinUid))
    .where(eq(votes.acteurUid, uid))
    .orderBy(desc(scrutins.dateScrutin), desc(scrutins.numero))
    .limit(limit);
}

export async function listScrutins(opts: {
  search?: string;
  limit?: number;
  offset?: number;
  chambre?: "AN" | "SENAT" | "all";
}) {
  const limit = opts.limit ?? 40;
  const offset = opts.offset ?? 0;
  const chambre = opts.chambre ?? "all";
  const clauses = [];
  if (opts.search?.trim()) {
    clauses.push(
      sql`${scrutins.searchVector} @@ plainto_tsquery('french', ${opts.search})`,
    );
  }
  if (chambre === "AN" || chambre === "SENAT") {
    clauses.push(eq(scrutins.chambre, chambre));
  }
  const where =
    clauses.length === 0
      ? undefined
      : clauses.length === 1
        ? clauses[0]
        : and(...clauses);

  return db
    .select({
      uid: scrutins.uid,
      chambre: scrutins.chambre,
      numero: scrutins.numero,
      dateScrutin: scrutins.dateScrutin,
      titre: scrutins.titre,
      sortCode: scrutins.sortCode,
      pour: scrutins.pour,
      contre: scrutins.contre,
      abstentions: scrutins.abstentions,
      nonVotants: scrutins.nonVotants,
      nombreVotants: scrutins.nombreVotants,
      dossierUid: scrutins.dossierUid,
    })
    .from(scrutins)
    .where(where)
    .orderBy(desc(scrutins.dateScrutin), desc(scrutins.numero))
    .limit(limit)
    .offset(offset);
}

export async function getScrutin(uid: string) {
  const [scrutin] = await db
    .select()
    .from(scrutins)
    .where(eq(scrutins.uid, uid))
    .limit(1);
  if (!scrutin) return null;

  let dossier: { uid: string; titre: string } | null = null;
  if (scrutin.dossierUid) {
    const [d] = await db
      .select({ uid: dossiers.uid, titre: dossiers.titre })
      .from(dossiers)
      .where(eq(dossiers.uid, scrutin.dossierUid))
      .limit(1);
    dossier = d ?? null;
  }

  const parGroupe = await db
    .select({
      groupeUid: organes.uid,
      libelle: organes.libelle,
      libelleAbrege: organes.libelleAbrege,
      couleur: organes.couleur,
      pour: sql<number>`count(*) FILTER (WHERE ${votes.position} = 'pour')::int`,
      contre: sql<number>`count(*) FILTER (WHERE ${votes.position} = 'contre')::int`,
      abstention: sql<number>`count(*) FILTER (WHERE ${votes.position} = 'abstention')::int`,
      nonVotant: sql<number>`count(*) FILTER (WHERE ${votes.position} = 'nonVotant')::int`,
    })
    .from(votes)
    .leftJoin(organes, eq(organes.uid, votes.groupeUid))
    .where(eq(votes.scrutinUid, uid))
    .groupBy(
      organes.uid,
      organes.libelle,
      organes.libelleAbrege,
      organes.couleur,
    )
    .orderBy(organes.libelle);

  return { scrutin, dossier, parGroupe };
}

export async function getScrutinVotes(
  uid: string,
  position?: string,
  groupeUid?: string,
) {
  const conditions = [eq(votes.scrutinUid, uid)];
  if (position) conditions.push(eq(votes.position, position));
  if (groupeUid) conditions.push(eq(votes.groupeUid, groupeUid));

  return db
    .select({
      acteurUid: acteurs.uid,
      prenom: acteurs.prenom,
      nom: acteurs.nom,
      position: votes.position,
      parDelegation: votes.parDelegation,
      groupeUid: organes.uid,
      groupeLibelle: organes.libelleAbrege,
      groupeCouleur: organes.couleur,
    })
    .from(votes)
    .innerJoin(acteurs, eq(acteurs.uid, votes.acteurUid))
    .leftJoin(organes, eq(organes.uid, votes.groupeUid))
    .where(and(...conditions))
    .orderBy(acteurs.nom, acteurs.prenom);
}

export async function listDossiers(opts: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = opts.limit ?? 40;
  const offset = opts.offset ?? 0;
  const searchClause = opts.search?.trim()
    ? sql`${dossiers.searchVector} @@ plainto_tsquery('french', ${opts.search})`
    : undefined;

  return db
    .select({
      uid: dossiers.uid,
      titre: dossiers.titre,
      titreChemin: dossiers.titreChemin,
      procedureLibelle: dossiers.procedureLibelle,
      legislature: dossiers.legislature,
    })
    .from(dossiers)
    .where(
      searchClause
        ? and(eq(dossiers.legislature, 17), searchClause)
        : eq(dossiers.legislature, 17),
    )
    .orderBy(desc(dossiers.uid))
    .limit(limit)
    .offset(offset);
}

export async function getDossier(uid: string) {
  const [dossier] = await db
    .select()
    .from(dossiers)
    .where(eq(dossiers.uid, uid))
    .limit(1);
  if (!dossier) return null;

  const acteRows = await db
    .select()
    .from(actes)
    .where(eq(actes.dossierUid, uid))
    .orderBy(actes.ordre);

  const documentRows = await db
    .select()
    .from(documents)
    .where(eq(documents.dossierUid, uid))
    .orderBy(desc(documents.dateDepot));

  const scrutinRows = await db
    .select({
      uid: scrutins.uid,
      numero: scrutins.numero,
      dateScrutin: scrutins.dateScrutin,
      titre: scrutins.titre,
      sortCode: scrutins.sortCode,
      pour: scrutins.pour,
      contre: scrutins.contre,
    })
    .from(scrutins)
    .where(eq(scrutins.dossierUid, uid))
    .orderBy(desc(scrutins.dateScrutin));

  const amendementRows = await db
    .select({
      uid: amendements.uid,
      numeroLong: amendements.numeroLong,
      articleDesignation: amendements.articleDesignation,
      sort: amendements.sort,
      etat: amendements.etat,
      dateDepot: amendements.dateDepot,
      auteurActeurUid: amendements.auteurActeurUid,
      dispositif: amendements.dispositif,
      exposeSommaire: amendements.exposeSommaire,
    })
    .from(amendements)
    .where(eq(amendements.dossierUid, uid))
    .orderBy(desc(amendements.dateDepot))
    .limit(100);

  const [resume] = await db
    .select()
    .from(resumesIa)
    .where(
      and(
        eq(resumesIa.sujetType, "dossier"),
        eq(resumesIa.sujetUid, uid),
      ),
    )
    .limit(1);

  const empreinteRows = await db
    .select()
    .from(empreintes)
    .where(eq(empreintes.dossierUid, uid));

  const [amdCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(amendements)
    .where(eq(amendements.dossierUid, uid));

  return {
    dossier,
    actes: acteRows,
    documents: documentRows,
    scrutins: scrutinRows,
    amendements: amendementRows,
    amendementsCount: amdCount?.n ?? 0,
    resume: resume ?? null,
    empreintes: empreinteRows,
  };
}

export async function searchAll(q: string) {
  const query = q.trim();
  if (!query) {
    return { dossiers: [], scrutins: [], deputes: [] };
  }

  const [dossierRows, scrutinRows, deputeRows] = await Promise.all([
    db
      .select({
        uid: dossiers.uid,
        titre: dossiers.titre,
        procedureLibelle: dossiers.procedureLibelle,
      })
      .from(dossiers)
      .where(
        and(
          eq(dossiers.legislature, 17),
          sql`${dossiers.searchVector} @@ plainto_tsquery('french', ${query})`,
        ),
      )
      .limit(10),
    db
      .select({
        uid: scrutins.uid,
        numero: scrutins.numero,
        titre: scrutins.titre,
        dateScrutin: scrutins.dateScrutin,
        sortCode: scrutins.sortCode,
      })
      .from(scrutins)
      .where(
        sql`${scrutins.searchVector} @@ plainto_tsquery('french', ${query})`,
      )
      .orderBy(desc(scrutins.dateScrutin))
      .limit(10),
    db
      .select({
        uid: acteurs.uid,
        prenom: acteurs.prenom,
        nom: acteurs.nom,
      })
      .from(acteurs)
      .innerJoin(
        mandats,
        and(
          eq(mandats.acteurUid, acteurs.uid),
          eq(mandats.codeTypeOrgane, "ASSEMBLEE"),
          eq(mandats.legislature, 17),
        ),
      )
      .where(
        or(
          sql`${acteurs.searchVector} @@ plainto_tsquery('french', ${query})`,
          sql`${acteurs.nom} ILIKE ${"%" + query + "%"}`,
          sql`${acteurs.prenom} ILIKE ${"%" + query + "%"}`,
        ),
      )
      .limit(10),
  ]);

  return {
    dossiers: dossierRows,
    scrutins: scrutinRows,
    deputes: deputeRows,
  };
}

export async function getHomeStats() {
  const [counts] = await db.execute<{
    dossiers: number;
    scrutins: number;
    deputes: number;
    votes: number;
  }>(sql`
    SELECT
      (SELECT count(*)::int FROM dossiers WHERE legislature = 17) AS dossiers,
      (SELECT count(*)::int FROM scrutins WHERE legislature = 17) AS scrutins,
      (
        SELECT count(DISTINCT acteur_uid)::int
        FROM mandats
        WHERE code_type_organe = 'ASSEMBLEE' AND legislature = 17
      ) AS deputes,
      (SELECT count(*)::int FROM votes) AS votes
  `);

  const derniersScrutins = await listScrutins({ limit: 6 });
  const derniersDossiers = await listDossiers({ limit: 6 });
  const derniersImports = await db
    .select()
    .from(imports)
    .orderBy(desc(imports.importedAt))
    .limit(5);

  const dossierUids = derniersDossiers.map((d) => d.uid);
  const empreinteRows =
    dossierUids.length === 0
      ? []
      : await db
          .select({
            dossierUid: empreintes.dossierUid,
            axe: empreintes.axe,
            impact: empreintes.impact,
          })
          .from(empreintes)
          .where(inArray(empreintes.dossierUid, dossierUids));

  const withEmpreinte = new Set(
    empreinteRows.map((r) => r.dossierUid),
  );

  const empreintesByDossier = new Map<
    string,
    { axe: string; impact: string }[]
  >();
  for (const row of empreinteRows) {
    const list = empreintesByDossier.get(row.dossierUid) ?? [];
    list.push({ axe: row.axe, impact: row.impact });
    empreintesByDossier.set(row.dossierUid, list);
  }

  const scoreInputs =
    dossierUids.length === 0
      ? []
      : await db.execute<{
          uid: string;
          documents_count: number;
          actes_count: number;
          scrutins_count: number;
          amendements_count: number;
          has_resume: number;
          type_codes: string | null;
        }>(sql`
          SELECT
            d.uid,
            (
              SELECT count(*)::int FROM documents doc
              WHERE doc.dossier_uid = d.uid
            ) AS documents_count,
            (
              SELECT count(*)::int FROM actes a
              WHERE a.dossier_uid = d.uid
            ) AS actes_count,
            (
              SELECT count(*)::int FROM scrutins s
              WHERE s.dossier_uid = d.uid
            ) AS scrutins_count,
            (
              SELECT count(*)::int FROM amendements am
              WHERE am.dossier_uid = d.uid
            ) AS amendements_count,
            (
              SELECT count(*)::int FROM resumes_ia r
              WHERE r.sujet_type = 'dossier' AND r.sujet_uid = d.uid
            ) AS has_resume,
            (
              SELECT string_agg(DISTINCT doc.type_code, ',')
              FROM documents doc
              WHERE doc.dossier_uid = d.uid
                AND doc.type_code IS NOT NULL
            ) AS type_codes
          FROM dossiers d
          WHERE d.uid IN (${sql.join(
            dossierUids.map((u) => sql`${u}`),
            sql`, `,
          )})
        `);

  const scoreByUid = new Map<
    string,
    { total: number; maxTotal: number }
  >();
  for (const row of scoreInputs as {
    uid: string;
    documents_count: number;
    actes_count: number;
    scrutins_count: number;
    amendements_count: number;
    has_resume: number;
    type_codes: string | null;
  }[]) {
    const score = computeScorePhronesis({
      documentsCount: Number(row.documents_count),
      documentTypeCodes: row.type_codes
        ? row.type_codes.split(",")
        : [],
      actesCount: Number(row.actes_count),
      scrutinsCount: Number(row.scrutins_count),
      amendementsCount: Number(row.amendements_count),
      hasResumeIa: Number(row.has_resume) > 0,
      hasEmpreinte: withEmpreinte.has(row.uid),
    });
    scoreByUid.set(row.uid, {
      total: score.total,
      maxTotal: score.maxTotal,
    });
  }

  const [lastScrutinDate] = await db.execute<{ d: string | null }>(sql`
    SELECT max(date_scrutin)::text AS d FROM scrutins
  `);

  return {
    counts: counts ?? {
      dossiers: 0,
      scrutins: 0,
      deputes: 0,
      votes: 0,
    },
    derniersScrutins,
    derniersDossiers: derniersDossiers.map((d) => ({
      ...d,
      hasEmpreinte: withEmpreinte.has(d.uid),
      scoreTotal: scoreByUid.get(d.uid)?.total ?? 0,
      scoreMax: scoreByUid.get(d.uid)?.maxTotal ?? 100,
      empreinteImpacts: empreintesByDossier.get(d.uid) ?? [],
    })),
    derniersImports,
    derniereDateScrutin: lastScrutinDate?.d ?? null,
  };
}

/** Fil « À l'Assemblée » : activité open data + aperçu sondages. */
export async function getActualiteAssemblee(opts?: {
  limit?: number;
}) {
  const limit = opts?.limit ?? 12;
  const scrutins = await listScrutins({ limit });
  const baseDossiers = await listDossiers({ limit });

  const dossiers = await Promise.all(
    baseDossiers.map(async (d) => {
      const rows = await db.execute<{
        position: string;
        n: number;
      }>(sql`
        SELECT position, count(*)::int AS n
        FROM sondages_dossiers
        WHERE dossier_uid = ${d.uid}
        GROUP BY position
      `);
      let sondagePour = 0;
      let sondageContre = 0;
      let sondagePasAvis = 0;
      for (const r of rows) {
        if (r.position === "pour") sondagePour = r.n;
        else if (r.position === "contre") sondageContre = r.n;
        else if (r.position === "pas_avis") sondagePasAvis = r.n;
      }
      return {
        ...d,
        sondagePour,
        sondageContre,
        sondagePasAvis,
        sondageTotal: sondagePour + sondageContre + sondagePasAvis,
      };
    }),
  );

  return { scrutins, dossiers };
}

export async function getImportHistory() {
  return db.select().from(imports).orderBy(desc(imports.importedAt));
}

/** Effectifs des groupes actifs pour hémicycle (AN ou Sénat). */
export async function listGroupesEffectifs(
  chambre: "AN" | "SENAT",
): Promise<
  {
    uid: string;
    libelle: string;
    libelleAbrege: string | null;
    couleur: string | null;
    effectif: number;
  }[]
> {
  const codeType = chambre === "SENAT" ? "GROUPESENAT" : "GP";
  const rows = await db.execute<{
    uid: string;
    libelle: string;
    libelleAbrege: string | null;
    couleur: string | null;
    effectif: number;
  }>(sql`
    SELECT
      o.uid,
      o.libelle,
      o.libelle_abrege AS "libelleAbrege",
      o.couleur,
      count(DISTINCT m.acteur_uid)::int AS effectif
    FROM organes o
    INNER JOIN mandats m
      ON m.organe_uid = o.uid
     AND m.code_type_organe = ${codeType}
     AND m.date_fin IS NULL
    WHERE o.code_type = ${codeType}
    GROUP BY o.uid, o.libelle, o.libelle_abrege, o.couleur
    HAVING count(DISTINCT m.acteur_uid) > 0
  `);
  return [...rows];
}


export async function listDossiersSansResume(limit = 20) {
  return db
    .select({
      uid: dossiers.uid,
      titre: dossiers.titre,
      procedureLibelle: dossiers.procedureLibelle,
    })
    .from(dossiers)
    .leftJoin(
      resumesIa,
      and(
        eq(resumesIa.sujetType, "dossier"),
        eq(resumesIa.sujetUid, dossiers.uid),
      ),
    )
    .where(
      and(eq(dossiers.legislature, 17), isNull(resumesIa.id)),
    )
    .orderBy(desc(dossiers.uid))
    .limit(limit);
}

/** Dossiers sans aucune ligne d'empreinte. */
export async function listDossiersSansEmpreinte(limit = 20) {
  return db
    .select({
      uid: dossiers.uid,
      titre: dossiers.titre,
      procedureLibelle: dossiers.procedureLibelle,
    })
    .from(dossiers)
    .leftJoin(empreintes, eq(empreintes.dossierUid, dossiers.uid))
    .where(
      and(eq(dossiers.legislature, 17), isNull(empreintes.id)),
    )
    .orderBy(desc(dossiers.uid))
    .limit(limit);
}
