/**
 * Indicateurs de travail parlementaire des députés (AN, 17e
 * législature) : participation réelle aux scrutins, amendements
 * déposés, adoptés et non défendus. Chaque valeur est située par
 * rapport aux autres députés : pas de note unique.
 *
 * Participation : dans les données de l'Assemblée, un député absent
 * n'apparaît pas dans la liste du scrutin. On rapporte donc ses votes
 * aux scrutins tenus pendant son mandat, pas aux scrutins où il
 * apparaît (ce qui donnait ~98 % à tout le monde).
 */

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { cachedQuery } from "@/lib/cache";

export type IndicateursDepute = {
  acteurUid: string;
  groupeUid: string | null;
  scrutinsTenus: number;
  scrutinsVotes: number;
  solennelsTenus: number;
  solennelsVotes: number;
  amendementsDeposes: number;
  amendementsAdoptes: number;
  /** Amendements arrivés en discussion (adoptés, rejetés, tombés, non soutenus…). */
  amendementsExamines: number;
  /** Examinés mais non défendus : l'auteur n'était pas là pour les soutenir. */
  amendementsNonSoutenus: number;
};

/** En deçà, le mandat est trop court pour comparer. */
const MIN_SCRUTINS_TENUS = 100;
/** En deçà, un taux sur les amendements ne veut pas dire grand-chose. */
const MIN_AMENDEMENTS = 10;

async function listIndicateursDeputesUncached(): Promise<
  IndicateursDepute[]
> {
  const rows = await db.execute<{
    acteur_uid: string;
    groupe_uid: string | null;
    scrutins_tenus: number;
    scrutins_votes: number;
    solennels_tenus: number;
    solennels_votes: number;
    amendements_deposes: number;
    amendements_adoptes: number;
    amendements_examines: number;
    amendements_non_soutenus: number;
  }>(sql`
    WITH mandats_an AS (
      SELECT acteur_uid, date_debut,
             coalesce(date_fin, current_date) AS date_fin
      FROM mandats
      WHERE code_type_organe = 'ASSEMBLEE'
        AND legislature = 17
        AND date_debut IS NOT NULL
    ),
    tenus AS (
      SELECT m.acteur_uid,
             count(DISTINCT s.uid)::int AS scrutins,
             count(DISTINCT s.uid) FILTER (
               WHERE s.type_vote_code = 'SPS'
             )::int AS solennels
      FROM mandats_an m
      JOIN scrutins s
        ON s.chambre = 'AN'
       AND s.date_scrutin BETWEEN m.date_debut AND m.date_fin
      GROUP BY m.acteur_uid
    ),
    -- Un non-votant (président de séance, membre du gouvernement) est
    -- présent : il est compté comme ayant participé.
    votes_an AS (
      SELECT v.acteur_uid,
             count(*)::int AS scrutins,
             count(*) FILTER (
               WHERE s.type_vote_code = 'SPS'
             )::int AS solennels
      FROM votes v
      JOIN scrutins s ON s.uid = v.scrutin_uid
      WHERE s.chambre = 'AN'
      GROUP BY v.acteur_uid
    ),
    amdt AS (
      SELECT auteur_acteur_uid AS acteur_uid,
             count(*)::int AS deposes,
             count(*) FILTER (WHERE sort = 'Adopté')::int AS adoptes,
             count(*) FILTER (WHERE etat = 'Discuté')::int AS examines,
             count(*) FILTER (WHERE sort = 'Non soutenu')::int AS non_soutenus
      FROM amendements
      WHERE auteur_acteur_uid IS NOT NULL
      GROUP BY auteur_acteur_uid
    ),
    groupe AS (
      SELECT DISTINCT ON (acteur_uid) acteur_uid, organe_uid
      FROM mandats
      WHERE code_type_organe = 'GP' AND legislature = 17
      ORDER BY acteur_uid, (date_fin IS NULL) DESC, date_debut DESC
    )
    SELECT t.acteur_uid,
           g.organe_uid AS groupe_uid,
           t.scrutins AS scrutins_tenus,
           least(coalesce(v.scrutins, 0), t.scrutins) AS scrutins_votes,
           t.solennels AS solennels_tenus,
           least(coalesce(v.solennels, 0), t.solennels) AS solennels_votes,
           coalesce(a.deposes, 0) AS amendements_deposes,
           coalesce(a.adoptes, 0) AS amendements_adoptes,
           coalesce(a.examines, 0) AS amendements_examines,
           coalesce(a.non_soutenus, 0) AS amendements_non_soutenus
    FROM tenus t
    LEFT JOIN votes_an v ON v.acteur_uid = t.acteur_uid
    LEFT JOIN amdt a ON a.acteur_uid = t.acteur_uid
    LEFT JOIN groupe g ON g.acteur_uid = t.acteur_uid
  `);

  return Array.from(rows).map((r) => ({
    acteurUid: r.acteur_uid,
    groupeUid: r.groupe_uid,
    scrutinsTenus: Number(r.scrutins_tenus),
    scrutinsVotes: Number(r.scrutins_votes),
    solennelsTenus: Number(r.solennels_tenus),
    solennelsVotes: Number(r.solennels_votes),
    amendementsDeposes: Number(r.amendements_deposes),
    amendementsAdoptes: Number(r.amendements_adoptes),
    amendementsExamines: Number(r.amendements_examines),
    amendementsNonSoutenus: Number(r.amendements_non_soutenus),
  }));
}

export const listIndicateursDeputes = cachedQuery(
  "listIndicateursDeputes",
  listIndicateursDeputesUncached,
);

/** Une mesure, située par rapport aux autres députés. */
export type Mesure = {
  valeur: number | null;
  mediane: number | null;
  /** Part des députés dont la valeur est inférieure (0 … 1). */
  rang: number | null;
};

type Extracteur = (d: IndicateursDepute) => number | null;

const taux =
  (num: (d: IndicateursDepute) => number, den: (d: IndicateursDepute) => number, min: number): Extracteur =>
  (d) => (den(d) >= min ? num(d) / den(d) : null);

export const MESURES = {
  participation: taux((d) => d.scrutinsVotes, (d) => d.scrutinsTenus, MIN_SCRUTINS_TENUS),
  solennels: taux((d) => d.solennelsVotes, (d) => d.solennelsTenus, 5),
  amendementsDeposes: ((d) =>
    d.scrutinsTenus >= MIN_SCRUTINS_TENUS ? d.amendementsDeposes : null) as Extracteur,
  tauxAdoption: taux((d) => d.amendementsAdoptes, (d) => d.amendementsDeposes, MIN_AMENDEMENTS),
  tauxNonSoutenus: taux((d) => d.amendementsNonSoutenus, (d) => d.amendementsExamines, MIN_AMENDEMENTS),
} satisfies Record<string, Extracteur>;

export type NomMesure = keyof typeof MESURES;

function mediane(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  const v = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m]! : (v[m - 1]! + v[m]!) / 2;
}

function valeursDe(
  tous: IndicateursDepute[],
  extraire: Extracteur,
): number[] {
  return tous
    .map(extraire)
    .filter((v): v is number => v != null);
}

/** Mesures d'un député, comparées à l'ensemble des députés. */
export function mesuresDepute(
  tous: IndicateursDepute[],
  acteurUid: string,
): Record<NomMesure, Mesure> | null {
  const depute = tous.find((d) => d.acteurUid === acteurUid);
  if (!depute) return null;
  const out = {} as Record<NomMesure, Mesure>;
  for (const [nom, extraire] of Object.entries(MESURES) as [NomMesure, Extracteur][]) {
    const population = valeursDe(tous, extraire);
    const valeur = extraire(depute);
    out[nom] = {
      valeur,
      mediane: mediane(population),
      rang:
        valeur == null || population.length === 0
          ? null
          : (population.filter((v) => v < valeur).length +
              population.filter((v) => v === valeur).length / 2) /
            population.length,
    };
  }
  return out;
}

/** Médiane des membres d'un groupe, comparée à la médiane de l'Assemblée. */
export function mesuresGroupe(
  tous: IndicateursDepute[],
  groupeUid: string,
): { membres: number; mesures: Record<NomMesure, Mesure> } {
  const membres = tous.filter((d) => d.groupeUid === groupeUid);
  const mesures = {} as Record<NomMesure, Mesure>;
  for (const [nom, extraire] of Object.entries(MESURES) as [NomMesure, Extracteur][]) {
    mesures[nom] = {
      valeur: mediane(valeursDe(membres, extraire)),
      mediane: mediane(valeursDe(tous, extraire)),
      rang: null,
    };
  }
  return { membres: membres.length, mesures };
}
