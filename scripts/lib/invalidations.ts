/**
 * Les batchs notent ici les fiches dont ils ont modifié les données ;
 * `pnpm cache:rafraichir` invalide ensuite ces fiches et elles seules
 * (voir lib/cache.ts). À appeler dans la transaction de l'écriture :
 * une ligne écrite sans son invalidation resterait à jamais périmée
 * sur le site, l'ingestion suivante ne la voyant plus comme modifiée.
 */
import { db } from "../../db";
import { invalidationsCache } from "../../db/schema";
import { FICHES_TAG, tagDossier, tagScrutin } from "../../lib/cache-tags";

/** `db` ou une transaction ouverte. */
type Executeur = Pick<typeof db, "insert">;

type Uids = Iterable<string | null | undefined>;

const PAR_LOT = 1000;

async function noter(executeur: Executeur, tags: Set<string>): Promise<void> {
  const liste = [...tags];
  for (let i = 0; i < liste.length; i += PAR_LOT) {
    await executeur
      .insert(invalidationsCache)
      .values(liste.slice(i, i + PAR_LOT).map((tag) => ({ tag })))
      .onConflictDoNothing();
  }
}

/** Fiches à relire : les identifiants absents (null) sont ignorés. */
export async function noterFiches(
  executeur: Executeur,
  fiches: { dossiers?: Uids; scrutins?: Uids },
): Promise<void> {
  const tags = new Set<string>();
  for (const uid of fiches.dossiers ?? []) if (uid) tags.add(tagDossier(uid));
  for (const uid of fiches.scrutins ?? []) if (uid) tags.add(tagScrutin(uid));
  await noter(executeur, tags);
}

/**
 * Toutes les fiches sont à relire : une donnée affichée sur un grand
 * nombre d'entre elles a changé (nom d'un élu, libellé d'un groupe…).
 */
export async function noterToutesLesFiches(
  executeur: Executeur,
): Promise<void> {
  await noter(executeur, new Set([FICHES_TAG]));
}
