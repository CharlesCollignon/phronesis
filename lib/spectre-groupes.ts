/**
 * Ordre schématique gauche → droite des groupes (lecture visuelle).
 * Ce n'est pas un score idéologique — uniquement un ordre d'affichage.
 */

/** Abréviations AN (17e législature), gauche → droite. */
export const ORDRE_SPECTRE_AN: readonly string[] = [
  "LFI-NFP",
  "GDR",
  "SOC",
  "EcoS",
  "LIOT",
  "Dem",
  "EPR",
  "HOR",
  "DR",
  "UDR",
  "RN",
  "NI",
];

/** Abréviations / libellés Sénat, gauche → droite. */
export const ORDRE_SPECTRE_SENAT: readonly string[] = [
  "CRCE-K",
  "SER",
  "GEST",
  "RDSE",
  "RDPI",
  "UC",
  "Les Indépendants",
  "Les Républicains",
  "NI",
];

/** Couleurs de secours (Sénat AMO souvent sans couleur). */
export const COULEURS_GROUPE_FALLBACK: Record<string, string> = {
  "LFI-NFP": "#C00D0D",
  GDR: "#830E21",
  SOC: "#E891B0",
  EcoS: "#77AA79",
  LIOT: "#E6C04A",
  Dem: "#F07E26",
  EPR: "#7B4591",
  HOR: "#5BA8D0",
  DR: "#8CB0DC",
  UDR: "#3367A7",
  RN: "#313567",
  NI: "#8D949A",
  "CRCE-K": "#A01828",
  SER: "#E0709A",
  GEST: "#5A9B5E",
  RDSE: "#C9A227",
  RDPI: "#8B5CF6",
  UC: "#F59E0B",
  "Les Indépendants": "#64748B",
  "Les Républicains": "#2451A3",
};

export function couleurGroupe(
  abrege: string | null | undefined,
  couleurAmo: string | null | undefined,
): string {
  if (couleurAmo && /^#?[0-9A-Fa-f]{3,8}$/.test(couleurAmo)) {
    return couleurAmo.startsWith("#") ? couleurAmo : `#${couleurAmo}`;
  }
  if (abrege && COULEURS_GROUPE_FALLBACK[abrege]) {
    return COULEURS_GROUPE_FALLBACK[abrege]!;
  }
  return "#8D949A";
}

export function spectreIndex(
  abrege: string | null | undefined,
  chambre: "AN" | "SENAT",
): number {
  const order =
    chambre === "AN" ? ORDRE_SPECTRE_AN : ORDRE_SPECTRE_SENAT;
  if (!abrege) return order.length + 10;
  const i = order.indexOf(abrege);
  return i === -1 ? order.length + 5 : i;
}

export function sortGroupesSpectre<
  T extends { libelleAbrege: string | null },
>(rows: T[], chambre: "AN" | "SENAT"): T[] {
  return [...rows].sort(
    (a, b) =>
      spectreIndex(a.libelleAbrege, chambre) -
      spectreIndex(b.libelleAbrege, chambre),
  );
}
