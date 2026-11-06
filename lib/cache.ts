import { unstable_cache } from "next/cache";

/**
 * Cache des lectures en base (Data Cache Next.js / Vercel).
 *
 * Les données open data ne changent qu'à l'ingestion hebdomadaire :
 * sans cache, chaque visite — robots compris — réveille le compute Neon.
 */

/**
 * Filet de sécurité : 30 jours. En pratique, les entrées sont invalidées
 * par `revalidateTag(OPEN_DATA_TAG)` à la fin de chaque ingestion
 * (POST /api/revalidate), donc Neon n'est relu qu'une fois par semaine
 * et par page visitée.
 */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Toutes les lectures en cache : invalidées après chaque ingestion. */
export const OPEN_DATA_TAG = "open-data";

/** Agrégats de sondages : invalidés à chaque vote. */
export const SONDAGES_TAG = "sondages";

/**
 * Le Data Cache survit aux déploiements, pour ne pas réveiller Neon à
 * chaque push. Incrémenter cette version quand le format renvoyé par une
 * requête en cache change (colonne ajoutée, objet restructuré…), sinon
 * le nouveau code relira d'anciennes entrées.
 */
const CACHE_VERSION = "v1";

const DATE_KEY = "__date";

// unstable_cache stocke du JSON : les Date (colonnes timestamp)
// reviendraient en chaînes. On les encode, puis on les restaure.
function encode(value: unknown): string {
  return JSON.stringify(
    value,
    function (this: Record<string, unknown>, key: string, v: unknown) {
      const raw = this[key];
      return raw instanceof Date ? { [DATE_KEY]: raw.toISOString() } : v;
    },
  );
}

function decode<T>(json: string): T {
  return JSON.parse(json, (_key, v: unknown) => {
    if (v !== null && typeof v === "object" && DATE_KEY in v) {
      return new Date((v as Record<string, string>)[DATE_KEY]);
    }
    return v;
  }) as T;
}

/**
 * Met en cache une fonction de lecture. La clé combine `key` et les
 * arguments ; `tags` permet une invalidation via `revalidateTag`.
 * Ne pas utiliser hors runtime Next (scripts batch) : lève une erreur.
 */
export function cachedQuery<Args extends unknown[], Result>(
  key: string,
  query: (...args: Args) => Promise<Result>,
  options: { tags?: string[]; revalidate?: number } = {},
): (...args: Args) => Promise<Result> {
  const cached = unstable_cache(
    async (...args: Args) => encode(await query(...args)),
    [CACHE_VERSION, key],
    {
      revalidate: options.revalidate ?? MAX_AGE_SECONDS,
      tags: [OPEN_DATA_TAG, ...(options.tags ?? [])],
    },
  );
  return async (...args: Args) => decode<Result>(await cached(...args));
}
