/**
 * Résonance Boussole ↔ Empreinte (projection partielle).
 * Ce n'est pas le Score Phronesis ni un jugement moral.
 */

import {
  AXES_BOUSSOLE,
  type AxeBoussole,
  type ProfilBoussole,
  similariteProfil,
} from "@/lib/dilemmes";
import {
  type AxeEmpreinte,
  type ImpactEmpreinte,
  isAxeEmpreinte,
  isImpactEmpreinte,
} from "@/lib/empreinte";

/** Mapping explicite Empreinte → axe Boussole (ou null = exclu). */
export const MAP_EMPREINTE_BOUSSOLE: Record<
  AxeEmpreinte,
  AxeBoussole | null
> = {
  liberte: "liberte",
  egalite: "egalite",
  solidarite: "solidarite",
  vie_privee: "vie_privee",
  responsabilite_individuelle: "responsabilite",
  durabilite: "ecologie",
  efficacite_economique: "marche",
  /** Approximation prudente : sécurité collective ↔ autorité. */
  securite: "autorite",
  etat_de_droit: null,
  souverainete: null,
};

export const AXES_EMPREINTE_MAPPES = (
  Object.entries(MAP_EMPREINTE_BOUSSOLE) as [
    AxeEmpreinte,
    AxeBoussole | null,
  ][]
)
  .filter(([, b]) => b != null)
  .map(([e]) => e);

export type EmpreinteImpactRow = {
  axe: string;
  impact: string;
};

/** Projection d'un impact qualitatif vers −1 … +1. */
export function projetImpact(
  impact: ImpactEmpreinte,
): number | null {
  switch (impact) {
    case "renforce":
      return 1;
    case "restreint":
      return -1;
    case "mitige":
      return 0;
    case "non_aborde":
    case "indetermine":
      return null;
  }
}

/**
 * Projette une empreinte dossier sur l'espace Boussole.
 * Axes non mappés ou non renseignés sont omis (0 neutre ensuite).
 */
export function projetEmpreinteVersBoussole(
  rows: EmpreinteImpactRow[],
): {
  profil: ProfilBoussole;
  axesUtilises: AxeBoussole[];
  axesEmpreinteUtilises: AxeEmpreinte[];
} {
  const sums: Partial<Record<AxeBoussole, number>> = {};
  const counts: Partial<Record<AxeBoussole, number>> = {};
  const axesEmpreinteUtilises: AxeEmpreinte[] = [];

  for (const row of rows) {
    if (!isAxeEmpreinte(row.axe) || !isImpactEmpreinte(row.impact)) {
      continue;
    }
    const axeB = MAP_EMPREINTE_BOUSSOLE[row.axe];
    if (axeB == null) continue;
    const v = projetImpact(row.impact);
    if (v == null) continue;
    sums[axeB] = (sums[axeB] ?? 0) + v;
    counts[axeB] = (counts[axeB] ?? 0) + 1;
    axesEmpreinteUtilises.push(row.axe);
  }

  const profil = {} as ProfilBoussole;
  const axesUtilises: AxeBoussole[] = [];
  for (const axe of AXES_BOUSSOLE) {
    const n = counts[axe] ?? 0;
    if (n === 0) {
      profil[axe] = 0;
    } else {
      profil[axe] = Math.max(-1, Math.min(1, (sums[axe] ?? 0) / n));
      axesUtilises.push(axe);
    }
  }

  return { profil, axesUtilises, axesEmpreinteUtilises };
}

export type ResonanceResult = {
  score: number;
  axesCompares: AxeBoussole[];
  axesMappables: number;
  profilLoi: ProfilBoussole;
  profilUtilisateur: ProfilBoussole;
};

/**
 * Similarité cosinus sur les axes où l'empreinte a une valeur
 * projetée (couverture partielle).
 */
export function computeResonance(
  profilUtilisateur: ProfilBoussole,
  rows: EmpreinteImpactRow[],
): ResonanceResult | null {
  const { profil: profilLoi, axesUtilises } =
    projetEmpreinteVersBoussole(rows);
  if (axesUtilises.length === 0) return null;

  const a = {} as ProfilBoussole;
  const b = {} as ProfilBoussole;
  for (const axe of AXES_BOUSSOLE) {
    if (axesUtilises.includes(axe)) {
      a[axe] = profilUtilisateur[axe];
      b[axe] = profilLoi[axe];
    } else {
      a[axe] = 0;
      b[axe] = 0;
    }
  }

  return {
    score: similariteProfil(a, b),
    axesCompares: axesUtilises,
    axesMappables: AXES_EMPREINTE_MAPPES.length,
    profilLoi,
    profilUtilisateur,
  };
}
