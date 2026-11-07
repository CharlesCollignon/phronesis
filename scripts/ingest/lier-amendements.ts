/**
 * Relie chaque scrutin AN portant sur un amendement à l'amendement
 * correspondant, à partir de son intitulé :
 *   « l'amendement n° 213 de M. Potier après l'article 8 du projet de
 *     loi de financement de la sécurité sociale pour 2026 (…) »
 *
 * Correspondance : même numéro (le préfixe I- / II- des lois de
 * finances et la mention « (Rect) » sont ignorés), nom de l'auteur
 * présent dans l'intitulé, amendement déposé dans les 120 jours avant
 * le scrutin. Si plusieurs amendements conviennent, on garde le plus
 * récemment déposé. Les sous-amendements ne sont pas reliés.
 *
 * À lancer après l'import des amendements. Usage : pnpm ingest:lier-amendements
 */
import { sql } from "drizzle-orm";

import { db } from "../../db";

/** Minuscules sans accents, pour comparer les noms. */
function plier(colonne: string): string {
  return (
    `translate(lower(${colonne}), ` +
    `'àâäéèêëîïôöùûüçÿ', 'aaaeeeeiioouuucy')`
  );
}

async function lierScrutinsAmendements(): Promise<number> {
  const result = await db.execute(
    sql.raw(`
    WITH s AS (
      SELECT uid, date_scrutin,
        (regexp_match(titre, '^l[’'']amendement n° *([0-9]+)'))[1] AS num,
        (regexp_match(titre,
          '^l[’'']amendement n° *[0-9]+ (?:\\(rect\\.\\) )?de (?:M\\.|Mme) (.+?) '
          || '(?:et les amendements|et |à l[’'']|après l[’'']|avant l[’'']'
          || '|au |aux |à la |de suppression|tendant|portant|sur )'))[1] AS auteur
      FROM scrutins
      WHERE chambre = 'AN' AND titre ~* '^l[’'']amendement n° *[0-9]+'
    ),
    a AS (
      SELECT uid, date_depot, auteur_acteur_uid,
        (regexp_match(numero_long, '^(?:I{1,2}-)?([0-9]+)'))[1] AS num
      FROM amendements
      WHERE numero_long ~ '^(I{1,2}-)?[0-9]+'
    ),
    candidats AS (
      SELECT s.uid AS scrutin_uid, a.uid AS amendement_uid,
        row_number() OVER (
          PARTITION BY s.uid ORDER BY a.date_depot DESC, a.uid DESC
        ) AS rang
      FROM s
      JOIN a
        ON a.num = s.num
       AND a.date_depot <= s.date_scrutin
       AND a.date_depot >= s.date_scrutin - 120
      JOIN acteurs ac ON ac.uid = a.auteur_acteur_uid
      WHERE s.auteur IS NOT NULL
        AND ${plier("s.auteur")} LIKE '%' || ${plier("ac.nom")} || '%'
    )
    UPDATE scrutins sc
    SET amendement_uid = c.amendement_uid
    FROM candidats c
    WHERE c.rang = 1
      AND sc.uid = c.scrutin_uid
      AND sc.amendement_uid IS DISTINCT FROM c.amendement_uid
  `),
  );
  return result.count ?? 0;
}

async function main(): Promise<void> {
  const start = Date.now();
  const modifies = await lierScrutinsAmendements();
  const [stats] = await db.execute<{ relies: number; total: number }>(sql`
    SELECT count(*) FILTER (WHERE amendement_uid IS NOT NULL)::int AS relies,
           count(*) FILTER (
             WHERE titre ~* '^l[’'']amendement n° *[0-9]+'
           )::int AS total
    FROM scrutins WHERE chambre = 'AN'
  `);
  console.log(
    `Scrutins reliés à un amendement : ${stats?.relies ?? "?"} / ${stats?.total ?? "?"} ` +
      `(${modifies} mis à jour) en ${Math.round((Date.now() - start) / 1000)}s`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
