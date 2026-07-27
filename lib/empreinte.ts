/** Axes de l'empreinte civique (ordre d'affichage). */
export const AXES_EMPREINTE = [
  "liberte",
  "egalite",
  "securite",
  "vie_privee",
  "solidarite",
  "responsabilite_individuelle",
  "etat_de_droit",
  "efficacite_economique",
  "durabilite",
  "souverainete",
] as const;

export type AxeEmpreinte = (typeof AXES_EMPREINTE)[number];

export const IMPACTS_EMPREINTE = [
  "renforce",
  "restreint",
  "mitige",
  "non_aborde",
  "indetermine",
] as const;

export type ImpactEmpreinte = (typeof IMPACTS_EMPREINTE)[number];

export const AXE_LABELS: Record<AxeEmpreinte, string> = {
  liberte: "Liberté",
  egalite: "Égalité",
  securite: "Sécurité",
  vie_privee: "Vie privée",
  solidarite: "Solidarité",
  responsabilite_individuelle: "Responsabilité individuelle",
  etat_de_droit: "État de droit",
  efficacite_economique: "Efficacité économique",
  durabilite: "Durabilité",
  souverainete: "Souveraineté",
};

export const IMPACT_LABELS: Record<ImpactEmpreinte, string> = {
  renforce: "Renforce",
  restreint: "Restreint",
  mitige: "Mitigé",
  non_aborde: "Non abordé",
  indetermine: "Indéterminé",
};

export function isAxeEmpreinte(value: string): value is AxeEmpreinte {
  return (AXES_EMPREINTE as readonly string[]).includes(value);
}

export function isImpactEmpreinte(
  value: string,
): value is ImpactEmpreinte {
  return (IMPACTS_EMPREINTE as readonly string[]).includes(value);
}
