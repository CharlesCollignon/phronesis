import { unstable_cache } from "next/cache";

/**
 * Cache des lectures en base (Data Cache Next.js / Vercel).
 *
 * Les données open data ne changent qu'à l'ingestion hebdomadaire :
 * sans cache, chaque visite — robots compris — réveille le compute Neon.
 */

/** Durée de vie par défaut d'une entrée : 24 h. */
const ONE_DAY_SECONDS = 60 * 60 * 24;

/** Agrégats de sondages : invalidés à chaque vote. */
export const SONDAGES_TAG = "sondages";

// Le Data Cache survit aux déploiements : on isole chaque déploiement
// pour qu'une requête modifiée ne relise jamais un ancien format.
const DEPLOYMENT_KEY = process.env.VERCEL_DEPLOYMENT_ID ?? "local";

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
    [DEPLOYMENT_KEY, key],
    {
      revalidate: options.revalidate ?? ONE_DAY_SECONDS,
      tags: options.tags,
    },
  );
  return async (...args: Args) => decode<Result>(await cached(...args));
}
