/**
 * Étiquettes du cache des lectures en base. Sans dépendance à Next :
 * les scripts batch les utilisent aussi pour dire ce qu'ils ont modifié.
 */

/** Listes, accueil, élus, groupes : invalidés après chaque ingestion. */
export const OPEN_DATA_TAG = "open-data";

/** Totaux des consultations : invalidés à chaque avis donné. */
export const SONDAGES_TAG = "sondages";

/**
 * Toutes les fiches dossier et scrutin à la fois. Réservé aux cas où
 * chacune doit être relue : nom d'un élu ou d'un groupe corrigé, purge,
 * changement de logique d'ingestion.
 */
export const FICHES_TAG = "fiches";

const UID = /^[A-Za-z0-9_-]{1,80}$/;
const TAG_FICHE = /^(dossier|scrutin):([A-Za-z0-9_-]{1,80})$/;

/**
 * Forme d'un identifiant de dossier ou de scrutin. Tout le reste (URL
 * sondées par des robots) est écarté avant le cache et la base.
 */
export function estUidFiche(uid: string): boolean {
  return UID.test(uid);
}

export function tagDossier(uid: string): string {
  return `dossier:${uid}`;
}

export function tagScrutin(uid: string): string {
  return `scrutin:${uid}`;
}

/**
 * Totaux de la consultation d'une fiche : invalidés quand un avis est
 * donné ou retiré sur elle, et sur elle seule. Sans cela, un seul avis
 * invaliderait toutes les fiches du site, qui portent ces totaux.
 */
export function tagSondageDossier(uid: string): string {
  return `sondage:dossier:${uid}`;
}

export function tagSondageScrutin(uid: string): string {
  return `sondage:scrutin:${uid}`;
}

export function estTagFiche(tag: unknown): tag is string {
  return typeof tag === "string" && TAG_FICHE.test(tag);
}

/** Page du site qui affiche la fiche désignée par l'étiquette. */
export function cheminFiche(tag: string): string | null {
  const m = TAG_FICHE.exec(tag);
  if (!m) return null;
  return `/${m[1] === "dossier" ? "dossiers" : "scrutins"}/${m[2]}`;
}
