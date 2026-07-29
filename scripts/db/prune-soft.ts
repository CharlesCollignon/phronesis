/**
 * Nettoyage soft Neon / Postgres (1B) — pas de troncature amendements.
 *
 * - Mesure pg_total_relation_size des tables lourdes
 * - Supprime amendements orphelins (dossier_uid IS NULL)
 * - Nullifie votes.cause_position
 * - Plafonne l'historique imports (KEEP_IMPORTS, défaut 50)
 *
 * Après migration : VACUUM ANALYZE recommandé (psql / Neon SQL).
 *
 * Usage : pnpm db:prune-soft
 */
import { sql } from "drizzle-orm";

import { db } from "../../db";

const KEEP_IMPORTS = Number(process.env.KEEP_IMPORTS ?? "50");

const HEAVY_TABLES = [
  "amendements",
  "votes",
  "scrutins",
  "mandats",
  "acteurs",
  "dossiers",
  "documents",
  "actes",
  "empreintes",
  "organes",
  "imports",
] as const;

type SizeRow = {
  relation: string;
  total_bytes: number;
  total_pretty: string;
};

async function measureSizes(): Promise<SizeRow[]> {
  const rows = await db.execute<{
    relation: string;
    total_bytes: number;
    total_pretty: string;
  }>(sql`
    SELECT
      c.relname AS relation,
      pg_total_relation_size(c.oid)::bigint AS total_bytes,
      pg_size_pretty(pg_total_relation_size(c.oid)) AS total_pretty
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname IN (
        'amendements', 'votes', 'scrutins', 'mandats', 'acteurs',
        'dossiers', 'documents', 'actes', 'empreintes', 'organes',
        'imports'
      )
    ORDER BY pg_total_relation_size(c.oid) DESC
  `);
  return (rows as SizeRow[]).map((r) => ({
    relation: String(r.relation),
    total_bytes: Number(r.total_bytes),
    total_pretty: String(r.total_pretty),
  }));
}

function logSizes(label: string, rows: SizeRow[]): void {
  console.log(`\n→ Tailles ${label}`);
  let sum = 0;
  for (const r of rows) {
    sum += r.total_bytes;
    console.log(`  ${r.relation.padEnd(16)} ${r.total_pretty}`);
  }
  console.log(
    `  ${"TOTAL (tables)".padEnd(16)} ` +
      `${(sum / (1024 * 1024)).toFixed(1)} MB`,
  );
}

async function main(): Promise<void> {
  console.log("Prune soft Phronesis (pas de troncature amendements)");
  void HEAVY_TABLES;

  const before = await measureSizes();
  logSizes("avant", before);

  const [orphanRow] = await db.execute<{ n: number }>(sql`
    SELECT count(*)::int AS n
    FROM amendements
    WHERE dossier_uid IS NULL
  `);
  const orphanCount = Number(orphanRow?.n ?? 0);
  console.log(`\n→ Amendements orphelins : ${orphanCount}`);
  if (orphanCount > 0) {
    await db.execute(sql`
      DELETE FROM amendements WHERE dossier_uid IS NULL
    `);
    console.log(`  supprimés : ${orphanCount}`);
  }

  const [causeRow] = await db.execute<{ n: number }>(sql`
    SELECT count(*)::int AS n
    FROM votes
    WHERE cause_position IS NOT NULL
  `);
  const causeCount = Number(causeRow?.n ?? 0);
  console.log(`→ votes.cause_position non null : ${causeCount}`);
  if (causeCount > 0) {
    await db.execute(sql`
      UPDATE votes SET cause_position = NULL
      WHERE cause_position IS NOT NULL
    `);
    console.log(`  nullifiés : ${causeCount}`);
  }

  const keep =
    Number.isFinite(KEEP_IMPORTS) && KEEP_IMPORTS > 0
      ? KEEP_IMPORTS
      : 50;
  const [importRow] = await db.execute<{ n: number }>(sql`
    WITH doomed AS (
      SELECT id
      FROM imports
      ORDER BY imported_at DESC
      OFFSET ${keep}
    ),
    deleted AS (
      DELETE FROM imports
      WHERE id IN (SELECT id FROM doomed)
      RETURNING id
    )
    SELECT count(*)::int AS n FROM deleted
  `);
  console.log(
    `→ imports au-delà des ${keep} plus récents : ` +
      `${Number(importRow?.n ?? 0)} supprimés`,
  );

  const after = await measureSizes();
  logSizes("après", after);

  console.log(`
→ Sur Neon SQL Editor (ou psql URL directe), lancer ensuite :
  VACUUM ANALYZE amendements;
  VACUUM ANALYZE votes;
  VACUUM ANALYZE imports;

Indexes redondants : appliquer pnpm db:migrate
(empreintes_dossier_idx, sondages_*_uid_idx, table notifications).
`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
