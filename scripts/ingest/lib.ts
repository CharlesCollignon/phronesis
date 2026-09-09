import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
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

/** True si --force ou INGEST_FORCE=1 : ignore le cache disque. */
export function shouldForceRefresh(): boolean {
  const env = process.env.INGEST_FORCE?.trim().toLowerCase();
  if (env === "1" || env === "true" || env === "yes") {
    return true;
  }
  return process.argv.includes("--force");
}

/**
 * True si le fichier cache existe et doit être réutilisé.
 * Supprime le fichier si un refresh forcé est demandé.
 */
export async function useCachedFile(
  dest: string,
  label: string,
): Promise<boolean> {
  const existing = await stat(dest).catch(() => null);
  if (!existing || existing.size === 0) return false;
  if (shouldForceRefresh()) {
    console.log(`[force] ignore cache ${label}`);
    await unlink(dest);
    return false;
  }
  console.log(
    `[cache] ${label} déjà présent (${existing.size} octets)`,
  );
  return true;
}

const DOWNLOAD_ATTEMPTS = 5;

const DOWNLOAD_HEADERS = {
  Accept: "*/*",
  "User-Agent":
    "phronesis-ingest/0.1 (+https://github.com/CharlesCollignon/phronesis)",
} as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function errorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err == null) return undefined;
  const direct = (err as { code?: unknown }).code;
  if (typeof direct === "string") return direct;
  const cause = (err as { cause?: unknown }).cause;
  if (typeof cause === "object" && cause != null) {
    const nested = (cause as { code?: unknown }).code;
    if (typeof nested === "string") return nested;
  }
  return undefined;
}

function isRetriableDownloadError(err: unknown): boolean {
  const code = errorCode(err);
  if (
    code === "UND_ERR_SOCKET" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "EPIPE" ||
    code === "UND_ERR_CONNECT_TIMEOUT"
  ) {
    return true;
  }
  const msg =
    err instanceof Error
      ? `${err.message} ${err.cause instanceof Error ? err.cause.message : ""}`
      : String(err);
  return /terminated|other side closed|socket|network|ECONNRESET|ETIMEDOUT|fetch failed/i.test(
    msg,
  );
}

function parseExpectedTotal(
  res: Response,
  offset: number,
): number | null {
  const range = res.headers.get("content-range");
  if (range) {
    const m = range.match(/\/(\d+)\s*$/);
    if (m) return Number(m[1]);
  }
  const length = Number(res.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) return null;
  return res.status === 206 ? offset + length : length;
}

/** Un essai : GET, éventuellement Range si un partiel est déjà là. */
async function downloadOnce(url: string, dest: string): Promise<void> {
  const existing = await stat(dest).catch(() => null);
  const offset = existing && existing.size > 0 ? existing.size : 0;
  const headers: Record<string, string> = { ...DOWNLOAD_HEADERS };
  if (offset > 0) {
    headers.Range = `bytes=${offset}-`;
    console.log(`[download] reprise à ${offset} octets`);
  }

  const res = await fetch(url, { headers });
  if (res.status === 416) {
    return;
  }
  if (!res.ok || !res.body) {
    throw new Error(`Téléchargement échoué (${res.status}) : ${url}`);
  }

  const append = offset > 0 && res.status === 206;
  if (offset > 0 && res.status === 200) {
    console.log("[download] le serveur ignore Range, redémarrage");
    await unlink(dest).catch(() => undefined);
  }

  const expected = parseExpectedTotal(res, append ? offset : 0);
  await pipeline(
    Readable.fromWeb(res.body as import("stream/web").ReadableStream),
    createWriteStream(dest, { flags: append ? "a" : "w" }),
  );

  const size = (await stat(dest)).size;
  if (size === 0) {
    throw new Error("fichier vide");
  }
  if (expected != null && size < expected) {
    throw new Error(`incomplet : ${size}/${expected} octets`);
  }
}

/** Télécharge un zip dans data/cache (cache local, retry + reprise). */
export async function download(dataset: {
  name: string;
  url: string;
}): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const dest = path.join(CACHE_DIR, `${dataset.name}.zip`);
  if (await useCachedFile(dest, `${dataset.name}.zip`)) {
    return dest;
  }
  console.log(`[download] ${dataset.url}`);

  let lastErr: unknown;
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
    try {
      await downloadOnce(dataset.url, dest);
      const size = (await stat(dest)).size;
      console.log(`[download] terminé : ${dest} (${size} octets)`);
      return dest;
    } catch (err) {
      lastErr = err;
      const size = await stat(dest)
        .then((s) => s.size)
        .catch(() => 0);
      const detail = err instanceof Error ? err.message : String(err);
      console.warn(
        `[download] tentative ${attempt}/${DOWNLOAD_ATTEMPTS} ` +
          `échouée (${size} octets) : ${detail}`,
      );
      if (attempt >= DOWNLOAD_ATTEMPTS || !isRetriableDownloadError(err)) {
        break;
      }
      const wait = Math.min(30_000, 1000 * 2 ** (attempt - 1));
      console.log(`[download] nouvel essai dans ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`Téléchargement échoué : ${dataset.url}`);
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
