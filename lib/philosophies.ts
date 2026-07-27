/**
 * Conceptions philosophiques de référence (profils types).
 * Profils sur axes Boussole, échelle −2 … +2.
 */

import {
  AXES_BOUSSOLE,
  type AxeBoussole,
  type ProfilBoussole,
  similariteProfil,
} from "@/lib/dilemmes";

export type PhilosophieRef = {
  id: string;
  label: string;
  /** Résumé court (listes, cartes). */
  description: string;
  /** Texte accessible pour la fiche dédiée. */
  presentation: string;
  /** Ce que ce cadre met en avant / en tension (neutre). */
  pointsCles: string[];
  profil: Record<AxeBoussole, number>;
};

export const PHILOSOPHIES: PhilosophieRef[] = [
  {
    id: "liberalisme",
    label: "Libéralisme",
    description:
      "Priorité aux libertés individuelles, à la " +
      "responsabilité et au marché, avec un État limité.",
    presentation:
      "Le libéralisme politique insiste sur les droits " +
      "individuels, la limitation du pouvoir et la " +
      "responsabilité personnelle. Sur le plan économique, " +
      "il fait confiance aux échanges volontaires et au " +
      "marché, tout en admettant souvent un socle de " +
      "règles communes. Ce n'est pas un parti : c'est une " +
      "façon d'arbitrer entre liberté et contrainte.",
    pointsCles: [
      "Libertés individuelles et vie privée marquées",
      "État plutôt limité, marché valorisé",
      "Responsabilité individuelle forte",
    ],
    profil: {
      liberte: 2,
      egalite: -1,
      solidarite: -1,
      responsabilite: 2,
      autorite: -1,
      vie_privee: 2,
      ecologie: 0,
      intervention_etat: -2,
      marche: 2,
      decentralisation: 1,
    },
  },
  {
    id: "republicanisme",
    label: "Républicanisme",
    description:
      "Bien commun, égalité civique, laïcité et État " +
      "structurant pour garantir l'unité.",
    presentation:
      "Le républicanisme met l'accent sur la citoyenneté " +
      "égale, le bien commun et des institutions capables " +
      "de tenir une unité politique. L'État y joue un rôle " +
      "structurant (école, droit, laïcité), sans forcément " +
      "rejeter le marché. L'égalité recherchée est d'abord " +
      "civique et procédurale, pas seulement matérielle.",
    pointsCles: [
      "Égalité civique et bien commun",
      "État structurant, autorité des institutions",
      "Décentralisation plutôt secondaire",
    ],
    profil: {
      liberte: 0,
      egalite: 2,
      solidarite: 1,
      responsabilite: 0,
      autorite: 1,
      vie_privee: 0,
      ecologie: 0,
      intervention_etat: 1,
      marche: -1,
      decentralisation: -1,
    },
  },
  {
    id: "socialisme",
    label: "Socialisme démocratique",
    description:
      "Solidarité forte, égalité matérielle et " +
      "régulation économique poussée.",
    presentation:
      "Le socialisme démocratique privilégie la réduction " +
      "des inégalités matérielles et une solidarité " +
      "institutionnalisée (protection sociale, services " +
      "publics). Il accepte une intervention forte de " +
      "l'État dans l'économie, et se méfie d'un marché " +
      "laissé à lui seul. La liberté y est pensée avec " +
      "des conditions sociales d'exercice.",
    pointsCles: [
      "Égalité et solidarité élevées",
      "Intervention de l'État marquée",
      "Marché fortement régulé",
    ],
    profil: {
      liberte: 0,
      egalite: 2,
      solidarite: 2,
      responsabilite: -1,
      autorite: 0,
      vie_privee: 0,
      ecologie: 1,
      intervention_etat: 2,
      marche: -2,
      decentralisation: 0,
    },
  },
  {
    id: "ecologie",
    label: "Écologie politique",
    description:
      "Préservation du vivant, sobriété et " +
      "réorientation de la production.",
    presentation:
      "L'écologie politique place la préservation du " +
      "vivant et des générations futures au centre des " +
      "arbitrage. Elle interroge la croissance, les " +
      "modes de production et parfois l'échelle des " +
      "décisions (local / global). Elle peut s'allier à " +
      "d'autres cadres (social, libéral…) selon les " +
      "auteurs — le profil ici est un type simplifié.",
    pointsCles: [
      "Écologie / durabilité très marquées",
      "Sobriété et réorientation productive",
      "Intervention publique souvent acceptée",
    ],
    profil: {
      liberte: 0,
      egalite: 1,
      solidarite: 1,
      responsabilite: 1,
      autorite: 0,
      vie_privee: 0,
      ecologie: 2,
      intervention_etat: 1,
      marche: -1,
      decentralisation: 1,
    },
  },
  {
    id: "conservatisme",
    label: "Conservatisme",
    description:
      "Ordre, responsabilité, stabilité des institutions " +
      "et prudence face au changement.",
    presentation:
      "Le conservatisme valorise la stabilité des " +
      "institutions, la responsabilité et une certaine " +
      "prudence face aux ruptures. L'autorité et l'ordre " +
      "y pèsent davantage que l'égalisation rapide des " +
      "conditions. Ce n'est pas l'immobilisme absolu : " +
      "c'est une préférence pour le changement gradué.",
    pointsCles: [
      "Autorité et responsabilité élevées",
      "Prudence face au changement",
      "Égalité / écologie moins prioritaires",
    ],
    profil: {
      liberte: -1,
      egalite: -1,
      solidarite: 0,
      responsabilite: 2,
      autorite: 2,
      vie_privee: 0,
      ecologie: -1,
      intervention_etat: 0,
      marche: 1,
      decentralisation: -1,
    },
  },
  {
    id: "libertarien",
    label: "Libertarisme",
    description:
      "État minimal, liberté maximale, méfiance envers " +
      "toute contrainte collective.",
    presentation:
      "Le libertarisme pousse loin la priorité à la " +
      "liberté individuelle et à la propriété : État " +
      "minimal, méfiance envers la redistribution et " +
      "les contraintes collectives. C'est un pôle " +
      "idéal-typique, utile pour situer les autres " +
      "cadres — pas une description d'un parti français.",
    pointsCles: [
      "Liberté et vie privée maximales",
      "État et solidarité très faibles",
      "Marché et décentralisation forts",
    ],
    profil: {
      liberte: 2,
      egalite: -2,
      solidarite: -2,
      responsabilite: 2,
      autorite: -2,
      vie_privee: 2,
      ecologie: 0,
      intervention_etat: -2,
      marche: 2,
      decentralisation: 2,
    },
  },
];

/** Convertit un profil −2…+2 en −1…+1 pour la viz / cosinus. */
export function profilPhilosophieNormalise(
  profil: Record<AxeBoussole, number>,
): ProfilBoussole {
  const out = {} as ProfilBoussole;
  for (const axe of AXES_BOUSSOLE) {
    out[axe] = Math.max(-1, Math.min(1, profil[axe] / 2));
  }
  return out;
}

export function getPhilosophie(
  id: string,
): PhilosophieRef | undefined {
  return PHILOSOPHIES.find((p) => p.id === id);
}

export function axesMarques(
  profil: Record<AxeBoussole, number>,
  n = 3,
): { forts: AxeBoussole[]; faibles: AxeBoussole[] } {
  const sorted = [...AXES_BOUSSOLE].sort(
    (a, b) => profil[b] - profil[a],
  );
  return {
    forts: sorted.slice(0, n),
    faibles: sorted.slice(-n).reverse(),
  };
}

export function rankPhilosophies(
  profil: ProfilBoussole,
): { philo: PhilosophieRef; score: number }[] {
  return PHILOSOPHIES.map((philo) => ({
    philo,
    score: similariteProfil(
      profil,
      profilPhilosophieNormalise(philo.profil),
    ),
  })).sort((x, y) => y.score - x.score);
}
