/**
 * Votes d'un groupe ou d'un député sur les amendements classés, par
 * thème et par orientation : « sur les amendements plus protecteurs de
 * l'environnement, le groupe a voté pour dans X % des cas ».
 *
 * Groupe : position majoritaire de ses membres sur chaque scrutin
 * (pour / contre ; égalités et abstentions majoritaires écartées).
 */

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { cachedQuery } from "@/lib/cache";

export type VoteOrientation = {
  theme: string;
  sens: string;
  pour: number;
  contre: number;
};

export type VotesParTheme = {
  orientations: VoteOrientation[];
  /** Amendements votés et classés, pour situer la couverture. */
  amendementsClasses: number;
};

async function amendementsClasses(): Promise<number> {
  const [r] = await db.execute<{ n: number }>(sql`
    SELECT count(DISTINCT s.amendement_uid)::int AS n
    FROM scrutins s
    JOIN amendements_classements c ON c.amendement_uid = s.amendement_uid
  `);
  return Number(r?.n ?? 0);
}

async function getVotesParThemeGroupeUncached(
  groupeUid: string,
): Promise<VotesParTheme> {
  const rows = await db.execute<VoteOrientation>(sql`
    WITH o AS (
      SELECT s.uid AS scrutin_uid, x->>'theme' AS theme, x->>'sens' AS sens
      FROM scrutins s
      JOIN amendements_classements c ON c.amendement_uid = s.amendement_uid
      CROSS JOIN LATERAL jsonb_array_elements(c.orientations) x
    ),
    g AS (
      SELECT v.scrutin_uid,
        count(*) FILTER (WHERE v.position = 'pour') AS pour,
        count(*) FILTER (WHERE v.position = 'contre') AS contre
      FROM votes v
      WHERE v.groupe_uid = ${groupeUid}
        AND v.scrutin_uid IN (SELECT scrutin_uid FROM o)
      GROUP BY v.scrutin_uid
    )
    SELECT o.theme, o.sens,
      count(*) FILTER (WHERE g.pour > g.contre)::int AS pour,
      count(*) FILTER (WHERE g.contre > g.pour)::int AS contre
    FROM o JOIN g USING (scrutin_uid)
    GROUP BY o.theme, o.sens
  `);
  return {
    orientations: Array.from(rows),
    amendementsClasses: await amendementsClasses(),
  };
}

async function getVotesParThemeDeputeUncached(
  acteurUid: string,
): Promise<VotesParTheme> {
  const rows = await db.execute<VoteOrientation>(sql`
    SELECT x->>'theme' AS theme, x->>'sens' AS sens,
      count(*) FILTER (WHERE v.position = 'pour')::int AS pour,
      count(*) FILTER (WHERE v.position = 'contre')::int AS contre
    FROM votes v
    JOIN scrutins s ON s.uid = v.scrutin_uid
    JOIN amendements_classements c ON c.amendement_uid = s.amendement_uid
    CROSS JOIN LATERAL jsonb_array_elements(c.orientations) x
    WHERE v.acteur_uid = ${acteurUid}
      AND v.position IN ('pour', 'contre')
    GROUP BY 1, 2
  `);
  return {
    orientations: Array.from(rows),
    amendementsClasses: await amendementsClasses(),
  };
}

export const getVotesParThemeGroupe = cachedQuery(
  "getVotesParThemeGroupe",
  getVotesParThemeGroupeUncached,
);

export const getVotesParThemeDepute = cachedQuery(
  "getVotesParThemeDepute",
  getVotesParThemeDeputeUncached,
);
