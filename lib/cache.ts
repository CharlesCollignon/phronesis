import { unstable_cache } from "next/cache";

import { OPEN_DATA_TAG } from "@/lib/cache-tags";

export {
  FICHES_TAG,
  OPEN_DATA_TAG,
  SONDAGES_TAG,
  tagDossier,
  tagScrutin,
} from "@/lib/cache-tags";

/**
 * Cache des lectures en base (Data Cache Next.js / Vercel).
 *
 * Neon s'endort après 5 minutes sans requête et se facture au temps
 * d'éveil : une lecture hors cache isolée coûte donc 5 minutes de
 * calcul, qu'elle vienne d'un visiteur ou d'un robot. Deux règles en
 * découlent :
 *
 * - on n'invalide que ce qui a changé. Les fiches dossier et scrutin
 *   ont chacune leur étiquette et ne sont relues que si l'ingestion a
 *   modifié leurs données ; le reste (listes, élus, groupes) porte
 *   `OPEN_DATA_TAG`, vidé après chaque ingestion ;
 * - ce qui vient d'être invalidé est relu aussitôt, d'un seul trait,
 *   pendant que Neon est encore éveillé (`pnpm cache:rafraichir`),
 *   plutôt qu'une page à la fois au fil des visites.
 */

/**
 * Filet de sécurité des lectures `OPEN_DATA_TAG` : 30 jours. En
 * pratique elles sont invalidées chaque semaine.
 */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Le Data Cache survit aux déploiements, pour ne pas réveiller Neon à
 * chaque push. Incrémenter cette version quand le format renvoyé par une
 * requête en cache change (colonne ajoutée, objet restructuré…), sinon
 * le nouveau code relira d'anciennes entrées.
 */
const CACHE_VERSION = "v4";

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

type CacheOptions<Args extends unknown[]> = {
  /**
   * Étiquettes d'invalidation, `OPEN_DATA_TAG` par défaut. Une fonction
   * les calcule à partir du premier argument (l'identifiant) : c'est ce
   * qui donne à chaque fiche sa propre étiquette.
   */
  tags?: string[] | ((id: Args[0]) => string[]);
  /**
   * Durée de vie en secondes ; `false` garde l'entrée jusqu'à
   * l'invalidation d'une de ses étiquettes.
   */
  revalidate?: number | false;
};

/**
 * Met en cache une fonction de lecture. La clé combine `key` et les
 * arguments ; les étiquettes permettent l'invalidation via
 * `revalidateTag`.
 * Ne pas utiliser hors runtime Next (scripts batch) : lève une erreur.
 */
export function cachedQuery<Args extends unknown[], Result>(
  key: string,
  query: (...args: Args) => Promise<Result>,
  // NoInfer : les arguments sont ceux de `query`, pas ceux de `tags`.
  options: CacheOptions<NoInfer<Args>> = {},
): (...args: Args) => Promise<Result> {
  const { tags = [OPEN_DATA_TAG], revalidate = MAX_AGE_SECONDS } = options;
  // unstable_cache intègre à la clé le texte de la fonction reçue. Or ce
  // texte, une fois minifié, diffère d'un bundle à l'autre (page, route,
  // image Open Graph) et peut changer à chaque build : la même lecture
  // serait en cache plusieurs fois, et tout serait relu en base après un
  // déploiement qui renomme un identifiant. Une fonction liée s'affiche
  // toujours « function () { [native code] } » : la clé ne dépend alors
  // que de CACHE_VERSION, de `key` et des arguments.
  const lire = (async (...args: Args): Promise<string> =>
    encode(await query(...args))).bind(null);
  const cacher = (etiquettes: string[]) =>
    unstable_cache(lire, [CACHE_VERSION, key], {
      revalidate,
      tags: etiquettes,
    });

  if (typeof tags === "function") {
    return async (...args: Args) =>
      decode<Result>(await cacher(tags(args[0]))(...args));
  }
  const cached = cacher(tags);
  return async (...args: Args) => decode<Result>(await cached(...args));
}
