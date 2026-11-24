"use client";

import { useSearchParams } from "next/navigation";

import { formatNumber } from "@/lib/format";

/**
 * Filtrage de la liste nominative dans le navigateur.
 *
 * La fiche d'un scrutin est statique : le serveur écrit toutes les
 * positions dans la page, une fois, et ne lit plus les filtres de l'URL
 * (les lire l'obligeait à rendre la page à chaque requête). Les filtres
 * de `VoteFilters` restent portés par l'URL ; ici on masque les lignes
 * qui n'y correspondent pas, et on recompte.
 *
 * Ces composants lisent l'URL : les placer sous un `<Suspense>`, sans
 * quoi Next sortirait toute la page du rendu statique.
 */

/** Positions comptées par groupe : `{ [groupeUid]: { [position]: n } }`. */
export type ComptesVotes = Record<string, Record<string, number>>;

/** Forme d'une valeur de filtre qu'on peut écrire dans un sélecteur CSS. */
const VALEUR_SURE = /^[A-Za-z0-9_-]{1,80}$/;

function lireFiltres(params: URLSearchParams): {
  position: string;
  groupe: string;
} {
  return {
    position: params.get("position") ?? "",
    groupe: params.get("groupe") ?? "",
  };
}

function compter(
  comptes: ComptesVotes,
  position: string,
  groupe: string,
): number {
  let n = 0;
  for (const [g, parPosition] of Object.entries(comptes)) {
    if (groupe && g !== groupe) continue;
    for (const [p, c] of Object.entries(parPosition)) {
      if (position && p !== position) continue;
      n += c;
    }
  }
  return n;
}

/** Le nombre de positions affichées, « (filtré) » quand un filtre joue. */
export function VoteCount({
  comptes,
  label,
}: {
  comptes: ComptesVotes;
  /** « députés » ou « sénateurs ». */
  label: string;
}): React.ReactElement {
  const { position, groupe } = lireFiltres(useSearchParams());
  return (
    <span className="num">
      {formatNumber(compter(comptes, position, groupe))} {label}
      {position || groupe ? " (filtré)" : ""}
    </span>
  );
}

/**
 * Masque, dans la liste `listId`, les lignes hors filtre. Chaque ligne
 * porte `data-position` et `data-groupe`. Sans ligne à montrer, la liste
 * s'efface devant un message.
 */
export function VoteListFilter({
  comptes,
  listId,
}: {
  comptes: ComptesVotes;
  listId: string;
}): React.ReactElement | null {
  const { position, groupe } = lireFiltres(useSearchParams());
  if (!position && !groupe) return null;

  const aucune = compter(comptes, position, groupe) === 0;
  const regles: string[] = [];
  // Une valeur qui n'a pas la forme d'un identifiant ne correspond à
  // aucune ligne : elle n'entre jamais dans la feuille de style.
  const formeSure =
    VALEUR_SURE.test(position || "x") && VALEUR_SURE.test(groupe || "x");
  const masquerTout = aucune || !formeSure;
  if (masquerTout) {
    regles.push(`#${listId}{display:none}`);
  } else {
    if (position) {
      regles.push(
        `#${listId} li:not([data-position="${position}"]){display:none}`,
      );
    }
    if (groupe) {
      regles.push(`#${listId} li:not([data-groupe="${groupe}"]){display:none}`);
    }
  }

  return (
    <>
      <style>{regles.join("")}</style>
      {masquerTout ? (
        <p className="mt-6 text-[15px] text-[#404040] dark:text-muted-foreground">
          Aucune position ne correspond à ces filtres.
        </p>
      ) : null}
    </>
  );
}
