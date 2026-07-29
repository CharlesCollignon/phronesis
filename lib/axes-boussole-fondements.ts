/**
 * Fondements pédagogiques des axes Boussole.
 * Source unique : glossaire /philosophies + contexte court quiz.
 * Ce ne sont pas des scores ni des jugements moraux.
 */

import {
  AXES_BOUSSOLE,
  type AxeBoussole,
} from "@/lib/dilemmes";

export type FondementAxe = {
  /** Définition en 2–3 phrases (glossaire). */
  sens: string;
  /** Distinction conceptuelle clé (glossaire + une ligne quiz). */
  distinction: string;
  /** Contre-sens fréquent à écarter (glossaire). */
  ceQueCeNestPas: string;
  /** Une phrase pour le parcours Boussole. */
  contexteCourt: string;
};

export const AXE_FONDEMENTS: Record<AxeBoussole, FondementAxe> = {
  liberte: {
    sens:
      "La liberté désigne ici la marge de manœuvre de " +
      "l'individu face aux règles, aux interdits et aux " +
      "contraintes collectives. Elle couvre aussi bien " +
      "l'expression, la circulation ou l'usage de ses biens " +
      "que la résistance à l'arbitraire.",
    distinction:
      "Liberté « négative » (ne pas être empêché) vs " +
      "liberté « positive » (pouvoir agir concrètement, " +
      "souvent via des moyens collectifs).",
    ceQueCeNestPas:
      "Ni licence sans limite, ni synonyme automatique de " +
      "dérégulation économique.",
    contexteCourt:
      "Marge de l'individu face aux règles et à la " +
      "contrainte collective.",
  },
  egalite: {
    sens:
      "L'égalité porte sur la réduction des écarts de " +
      "condition, de droits ou d'accès aux ressources " +
      "essentielles. Elle peut viser le traitement par la " +
      "loi, les chances de départ ou les résultats sociaux.",
    distinction:
      "Égalité des droits / des chances / des résultats : " +
      "trois exigences distinctes, souvent en tension.",
    ceQueCeNestPas:
      "Ni uniformité des vies, ni refus de toute " +
      "différence de talent ou d'effort.",
    contexteCourt:
      "Réduction des écarts de condition, de droits ou " +
      "d'accès.",
  },
  solidarite: {
    sens:
      "La solidarité désigne la mutualisation des risques " +
      "et les devoirs envers les plus vulnérables — via " +
      "l'assurance sociale, l'impôt ou des institutions " +
      "communes. Elle lie le destin individuel au destin " +
      "collectif.",
    distinction:
      "Solidarité institutionnelle (droits sociaux) vs " +
      "charité privée : l'une crée des créances, l'autre " +
      "reste discrétionnaire.",
    ceQueCeNestPas:
      "Ni compassion individuelle seule, ni abolition de " +
      "toute responsabilité personnelle.",
    contexteCourt:
      "Mutualisation des risques et devoirs envers les " +
      "plus vulnérables.",
  },
  responsabilite: {
    sens:
      "La responsabilité mesure le poids accordé aux " +
      "choix, à l'effort et aux conséquences individuelles. " +
      "Elle structure la façon dont on attribue mérite, " +
      "faute ou réparation.",
    distinction:
      "Responsabilité individuelle vs responsabilité " +
      "collective ou structurelle (quand le contexte " +
      "explique une large part du résultat).",
    ceQueCeNestPas:
      "Ni culpabilisation des précaires, ni déni des " +
      "contraintes sociales.",
    contexteCourt:
      "Poids de l'effort, des choix et des conséquences " +
      "individuelles.",
  },
  autorite: {
    sens:
      "L'autorité désigne le rôle de l'ordre, de la " +
      "contrainte légitime et des institutions de contrôle " +
      "(police, justice, normes). Elle pose qui peut " +
      "imposer une règle et à quelles conditions.",
    distinction:
      "Autorité légitime (procédure, contrôle) vs " +
      "pouvoir arbitraire : la première se justifie, le " +
      "second s'impose.",
    ceQueCeNestPas:
      "Ni culte de la force, ni rejet de toute règle " +
      "commune.",
    contexteCourt:
      "Rôle de l'ordre, de la contrainte et des " +
      "institutions de contrôle.",
  },
  vie_privee: {
    sens:
      "La vie privée protège l'intimité, les données " +
      "personnelles et la maîtrise de ce que l'on révèle " +
      "de soi. Elle limite la surveillance — publique ou " +
      "privée — et les usages secondaires des " +
      "informations.",
    distinction:
      "Secret de l'intimité vs protection des données " +
      "(fichiers, traces numériques, profilage).",
    ceQueCeNestPas:
      "Ni opacity totale face à la justice, ni refus de " +
      "toute transparence légitime.",
    contexteCourt:
      "Protection de l'intimité et des données " +
      "personnelles.",
  },
  ecologie: {
    sens:
      "L'écologie porte sur la préservation du vivant, " +
      "des communs naturels et des générations futures. " +
      "Elle arbitre entre usages présents des ressources " +
      "et limites planétaires.",
    distinction:
      "Protection environnementale « dans » la croissance " +
      "vs sobriété ou transformation plus radicale du " +
      "modèle productif.",
    ceQueCeNestPas:
      "Ni simple esthétique du paysage, ni score moral " +
      "individuel de consommation.",
    contexteCourt:
      "Préservation du vivant et des générations " +
      "futures.",
  },
  intervention_etat: {
    sens:
      "L'intervention de l'État mesure le degré " +
      "d'action publique dans l'économie et la société : " +
      "régulation, services publics, planification, " +
      "aides ou nationalisations.",
    distinction:
      "État régulateur (fixer les règles) vs État " +
      "producteur ou planificateur (agir comme acteur " +
      "économique).",
    ceQueCeNestPas:
      "Ni État total, ni équivalent automatique de la " +
      "gauche partisane.",
    contexteCourt:
      "Degré d'action publique dans l'économie et la " +
      "société.",
  },
  marche: {
    sens:
      "Le marché désigne la confiance accordée à la " +
      "concurrence, aux prix et aux échanges volontaires " +
      "pour allouer ressources et incitations. Il pose " +
      "aussi la question des défaillances (monopoles, " +
      "externalités).",
    distinction:
      "Marché comme mécanisme d'allocation vs marché " +
      "comme horizon normatif (« tout doit être " +
      "marchand »).",
    ceQueCeNestPas:
      "Ni apologie du laisser-faire sans règles, ni " +
      "refus de toute coordination privée.",
    contexteCourt:
      "Confiance dans la concurrence et les mécanismes " +
      "de prix.",
  },
  decentralisation: {
    sens:
      "La décentralisation porte sur la proximité des " +
      "décisions : communes, départements, régions, " +
      "versus pouvoir central. Elle touche la " +
      "légitimité, l'efficacité et l'égalité " +
      "territoriale.",
    distinction:
      "Décentralisation (compétences locales) vs " +
      "fédéralisme ou autonomie ; proximité n'implique " +
      "pas automatiquement plus de démocratie.",
    ceQueCeNestPas:
      "Ni fragmentation du droit, ni hostilité a priori " +
      "à toute norme nationale.",
    contexteCourt:
      "Proximité des décisions (local) vs pouvoir " +
      "central.",
  },
};

/** Hint court — alias de contexteCourt (compat UI). */
export const AXE_BOUSSOLE_HINTS: Record<AxeBoussole, string> =
  Object.fromEntries(
    AXES_BOUSSOLE.map((axe) => [
      axe,
      AXE_FONDEMENTS[axe].contexteCourt,
    ]),
  ) as Record<AxeBoussole, string>;
