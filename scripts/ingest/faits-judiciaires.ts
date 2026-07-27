/**
 * Import des décisions judiciaires publiques définitives
 * depuis data/faits-judiciaires-publics.json (curaté).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { db, schema } from "../../db";
import { logImport } from "./lib";

const { faitsJudiciairesPublics, acteurs } = schema;

const SOURCE_PATH = path.join(
  process.cwd(),
  "data",
  "faits-judiciaires-publics.json",
);

type FaitRaw = {
  acteur_uid?: string;
  date_decision?: string | null;
  juridiction?: string | null;
  resume?: string;
  source_url?: string;
  source_label?: string;
  definitive?: boolean;
  _comment?: string;
};

function isEntry(row: FaitRaw): row is FaitRaw & {
  acteur_uid: string;
  resume: string;
  source_url: string;
  source_label: string;
} {
  return (
    typeof row.acteur_uid === "string" &&
    typeof row.resume === "string" &&
    typeof row.source_url === "string" &&
    typeof row.source_label === "string" &&
    !row._comment
  );
}

export async function ingestFaitsJudiciaires(): Promise<void> {
  const started = Date.now();
  const raw = JSON.parse(
    await readFile(SOURCE_PATH, "utf8"),
  ) as FaitRaw[];

  if (!Array.isArray(raw)) {
    throw new Error("faits-judiciaires-publics.json doit être un tableau");
  }

  const known = new Set(
    (
      await db.select({ uid: acteurs.uid }).from(acteurs)
    ).map((a) => a.uid),
  );

  const rows = [];
  for (const item of raw) {
    if (!isEntry(item)) continue;
    if (!known.has(item.acteur_uid)) {
      console.warn(
        `[faits] acteur inconnu, skip : ${item.acteur_uid}`,
      );
      continue;
    }
    if (item.definitive === false) {
      console.warn(
        `[faits] non définitif refusé : ${item.acteur_uid}`,
      );
      continue;
    }
    if (item.resume.length > 160) {
      throw new Error(
        `Résumé > 160 car. pour ${item.acteur_uid}`,
      );
    }
    rows.push({
      acteurUid: item.acteur_uid,
      dateDecision: item.date_decision ?? null,
      juridiction: item.juridiction ?? null,
      resume: item.resume,
      sourceUrl: item.source_url,
      sourceLabel: item.source_label,
      definitive: true as const,
    });
  }

  await db.delete(faitsJudiciairesPublics);
  if (rows.length > 0) {
    await db.insert(faitsJudiciairesPublics).values(rows);
  }

  await logImport(
    "faits_judiciaires_publics",
    `file://${SOURCE_PATH}`,
    rows.length,
    Date.now() - started,
  );
  console.log(`[faits] importés=${rows.length}`);
}

async function main(): Promise<void> {
  await ingestFaitsJudiciaires();
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
