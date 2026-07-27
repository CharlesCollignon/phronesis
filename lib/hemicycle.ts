/**
 * Calcul des arcs d'hémicycle synthétique (par groupes).
 */

import {
  couleurGroupe,
  sortGroupesSpectre,
} from "@/lib/spectre-groupes";

export type GroupeHemicycleInput = {
  uid: string;
  libelle: string;
  libelleAbrege: string | null;
  couleur: string | null;
  effectif: number;
};

export type ArcHemicycle = {
  uid: string;
  libelle: string;
  abrege: string;
  couleur: string;
  effectif: number;
  /** Angle début (radians), demi-cercle supérieur. */
  startAngle: number;
  endAngle: number;
};

/**
 * Demi-cercle de π (gauche) à 0 (droite), ouvert vers le bas
 * (tradition visuelle de l'hémicycle vu de face).
 */
export function buildArcs(
  groups: GroupeHemicycleInput[],
  chambre: "AN" | "SENAT",
): ArcHemicycle[] {
  const sorted = sortGroupesSpectre(groups, chambre).filter(
    (g) => g.effectif > 0,
  );
  const total = sorted.reduce((s, g) => s + g.effectif, 0);
  if (total === 0) return [];

  const span = Math.PI;
  let cursor = Math.PI; // start left
  const arcs: ArcHemicycle[] = [];

  for (const g of sorted) {
    const slice = (g.effectif / total) * span;
    const start = cursor;
    const end = cursor - slice;
    const abrege = g.libelleAbrege ?? g.libelle.slice(0, 3);
    arcs.push({
      uid: g.uid,
      libelle: g.libelle,
      abrege,
      couleur: couleurGroupe(g.libelleAbrege, g.couleur),
      effectif: g.effectif,
      startAngle: start,
      endAngle: end,
    });
    cursor = end;
  }
  return arcs;
}

/** Path SVG d'un anneau entre rInner et rOuter. */
export function arcPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
): string {
  const polar = (r: number, a: number): [number, number] => [
    cx + r * Math.cos(a),
    cy - r * Math.sin(a),
  ];
  const [x0, y0] = polar(rOuter, startAngle);
  const [x1, y1] = polar(rOuter, endAngle);
  const [x2, y2] = polar(rInner, endAngle);
  const [x3, y3] = polar(rInner, startAngle);
  const large = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
  return [
    `M ${x0} ${y0}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x3} ${y3}`,
    "Z",
  ].join(" ");
}
