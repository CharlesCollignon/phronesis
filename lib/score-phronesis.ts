/**
 * Score Phronesis v1 — robustesse documentaire (déterministe, pas d'IA).
 * Mesure la qualité du socle d'analyse, jamais la valeur morale d'une loi.
 */
export const SCORE_PHRONESIS_VERSION = "SCORE_PHRONESIS_V1";

export type CritereScore = {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  rempli: boolean;
  detail: string;
};

export type ScorePhronesis = {
  version: typeof SCORE_PHRONESIS_VERSION;
  total: number;
  maxTotal: number;
  criteres: CritereScore[];
};

export type ScorePhronesisInputs = {
  documentsCount: number;
  documentTypeCodes: string[];
  actesCount: number;
  scrutinsCount: number;
  amendementsCount: number;
  hasResumeIa: boolean;
  hasEmpreinte: boolean;
};

const WEIGHTS = {
  documents: 20,
  diversiteDocs: 15,
  actes: 20,
  scrutins: 15,
  amendements: 10,
  resumeIa: 10,
  empreinte: 10,
} as const;

/** Calcule le score documentaire d'un dossier. */
export function computeScorePhronesis(
  input: ScorePhronesisInputs,
): ScorePhronesis {
  const types = new Set(
    input.documentTypeCodes.filter((t) => t != null && t !== ""),
  );

  const criteres: CritereScore[] = [
    {
      id: "documents",
      label: "Documents liés",
      maxPoints: WEIGHTS.documents,
      rempli: input.documentsCount > 0,
      points: input.documentsCount > 0 ? WEIGHTS.documents : 0,
      detail:
        input.documentsCount > 0
          ? `${input.documentsCount} document(s)`
          : "Aucun document",
    },
    {
      id: "diversite",
      label: "Diversité des types de documents",
      maxPoints: WEIGHTS.diversiteDocs,
      rempli: types.size >= 2,
      points:
        types.size >= 3
          ? WEIGHTS.diversiteDocs
          : types.size === 2
            ? Math.round(WEIGHTS.diversiteDocs * 0.7)
            : types.size === 1
              ? Math.round(WEIGHTS.diversiteDocs * 0.35)
              : 0,
      detail:
        types.size > 0
          ? `${types.size} type(s) distinct(s)`
          : "Aucun type",
    },
    {
      id: "actes",
      label: "Actes procéduraux",
      maxPoints: WEIGHTS.actes,
      rempli: input.actesCount > 0,
      points:
        input.actesCount >= 5
          ? WEIGHTS.actes
          : input.actesCount > 0
            ? Math.round(WEIGHTS.actes * 0.5)
            : 0,
      detail:
        input.actesCount > 0
          ? `${input.actesCount} étape(s)`
          : "Aucune étape",
    },
    {
      id: "scrutins",
      label: "Scrutins publics liés",
      maxPoints: WEIGHTS.scrutins,
      rempli: input.scrutinsCount > 0,
      points:
        input.scrutinsCount >= 3
          ? WEIGHTS.scrutins
          : input.scrutinsCount > 0
            ? Math.round(WEIGHTS.scrutins * 0.6)
            : 0,
      detail:
        input.scrutinsCount > 0
          ? `${input.scrutinsCount} scrutin(s)`
          : "Aucun scrutin public lié",
    },
    {
      id: "amendements",
      label: "Amendements",
      maxPoints: WEIGHTS.amendements,
      rempli: input.amendementsCount > 0,
      points:
        input.amendementsCount >= 10
          ? WEIGHTS.amendements
          : input.amendementsCount > 0
            ? Math.round(WEIGHTS.amendements * 0.5)
            : 0,
      detail:
        input.amendementsCount > 0
          ? `${input.amendementsCount}+ amendement(s)`
          : "Aucun amendement",
    },
    {
      id: "resume_ia",
      label: "Résumé de vulgarisation",
      maxPoints: WEIGHTS.resumeIa,
      rempli: input.hasResumeIa,
      points: input.hasResumeIa ? WEIGHTS.resumeIa : 0,
      detail: input.hasResumeIa ? "Présent" : "Absent",
    },
    {
      id: "empreinte",
      label: "Empreinte civique",
      maxPoints: WEIGHTS.empreinte,
      rempli: input.hasEmpreinte,
      points: input.hasEmpreinte ? WEIGHTS.empreinte : 0,
      detail: input.hasEmpreinte ? "Présente" : "Absente",
    },
  ];

  const total = criteres.reduce((s, c) => s + c.points, 0);
  const maxTotal = criteres.reduce((s, c) => s + c.maxPoints, 0);

  return {
    version: SCORE_PHRONESIS_VERSION,
    total,
    maxTotal,
    criteres,
  };
}
