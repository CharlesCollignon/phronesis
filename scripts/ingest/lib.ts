import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import yauzl from "yauzl";

import { db } from "../../db";
import { imports } from "../../db/schema";

export const CACHE_DIR = path.join(process.cwd(), "data", "cache");

export const LEGISLATURE = 17;

const BASE =
  "https://data.assemblee-nationale.fr/static/openData/repository/17";

export const DATASETS = {
  acteurs: {
    name: "AMO20_dep_sen_min_tous_mandats_et_organes",
    url: `${BASE}/amo/deputes_senateurs_ministres_legislature/AMO20_dep_sen_min_tous_mandats_et_organes.json.zip`,
  },
  dossiers: {
    name: "Dossiers_Legislatifs",
    url: `${BASE}/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`,
  },
  scrutins: {
    name: "Scrutins",
    url: `${BASE}/loi/scrutins/Scrutins.json.zip`,
  },
  amendements: {
    name: "Amendements",
    url: `${BASE}/loi/amendements_div_legis/Amendements.json.zip`,
  },
} as const;

/** Télécharge un zip dans data/cache (avec cache local). */
export async function download(dataset: {
  name: string;
  url: string;
}): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const dest = path.join(CACHE_DIR, `${dataset.name}.zip`);
  const existing = await stat(dest).catch(() => null);
  if (existing && existing.size > 0) {
    console.log(`[cache] ${dataset.name}.zip déjà présent (${existing.size} octets)`);
    return dest;
  }
  console.log(`[download] ${dataset.url}`);
  const res = await fetch(dataset.url);
  if (!res.ok || !res.body) {
    throw new Error(`Téléchargement échoué (${res.status}) : ${dataset.url}`);
  }
  await pipeline(
    Readable.fromWeb(res.body as import("stream/web").ReadableStream),
    createWriteStream(dest),
  );
  const size = (await stat(dest)).size;
  console.log(`[download] terminé : ${dest} (${size} octets)`);
  return dest;
}

/**
 * Itère sur chaque entrée JSON d'un zip, en streaming (faible mémoire).
 * `filter` reçoit le chemin de l'entrée dans le zip.
 */
export async function forEachZipEntry(
  zipPath: string,
  filter: (entryPath: string) => boolean,
  handler: (entryPath: string, content: string) => Promise<void> | void,
): Promise<number> {
  let count = 0;
  await new Promise<void>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      zipfile.on("error", reject);
      zipfile.on("end", () => resolve());
      zipfile.on("entry", (entry) => {
        if (entry.fileName.endsWith("/") || !filter(entry.fileName)) {
          zipfile.readEntry();
          return;
        }
        zipfile.openReadStream(entry, (streamErr, stream) => {
          if (streamErr) return reject(streamErr);
          const chunks: Buffer[] = [];
          stream.on("data", (c: Buffer) => chunks.push(c));
          stream.on("error", reject);
          stream.on("end", async () => {
            try {
              await handler(
                entry.fileName,
                Buffer.concat(chunks).toString("utf-8"),
              );
              count++;
              if (count % 5000 === 0) {
                console.log(`  … ${count} entrées traitées`);
              }
              zipfile.readEntry();
            } catch (e) {
              reject(e);
            }
          });
        });
      });
      zipfile.readEntry();
    });
  });
  return count;
}

/** Les dumps AN encodent parfois les valeurs simples comme {"#text": …}. */
export function asText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "#text" in (value as object)) {
    return asText((value as Record<string, unknown>)["#text"]);
  }
  return null;
}

/** Normalise les tableaux XML→JSON (élément unique = objet nu). */
export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function asInt(value: unknown): number | null {
  const t = asText(value);
  if (t == null || t === "") return null;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}

/** Tronque une date ISO avec timezone en date simple YYYY-MM-DD. */
export function asDate(value: unknown): string | null {
  const t = asText(value);
  if (!t) return null;
  const m = t.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

/** Journalise un import dans la table de traçabilité. */
export async function logImport(
  dataset: string,
  sourceUrl: string,
  rowCount: number,
  durationMs: number,
): Promise<void> {
  await db.insert(imports).values({ dataset, sourceUrl, rowCount, durationMs });
}

/** Insère par lots pour éviter les requêtes géantes. */
export async function inBatches<T>(
  rows: T[],
  size: number,
  fn: (batch: T[]) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += size) {
    await fn(rows.slice(i, i + size));
  }
}
