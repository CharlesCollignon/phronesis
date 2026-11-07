/**
 * Dilemmes et axes de la Boussole Phronesis.
 * Pas de question gauche/droite — uniquement des arbitrages de valeurs.
 * Chaque dilemme propose 4 choix = 4 logiques distinctes (non colinéaires),
 * avec poids rédigés à la main (pas de spectre A↔B interpolé).
 */

export const AXES_BOUSSOLE = [
  "liberte",
  "egalite",
  "solidarite",
  "responsabilite",
  "autorite",
  "vie_privee",
  "ecologie",
  "intervention_etat",
  "marche",
  "decentralisation",
] as const;

export type AxeBoussole = (typeof AXES_BOUSSOLE)[number];

export const AXE_BOUSSOLE_LABELS: Record<AxeBoussole, string> = {
  liberte: "Liberté",
  egalite: "Égalité",
  solidarite: "Solidarité",
  responsabilite: "Responsabilité",
  autorite: "Autorité",
  vie_privee: "Vie privée",
  ecologie: "Écologie",
  intervention_etat: "Intervention de l'État",
  marche: "Marché",
  decentralisation: "Décentralisation",
};

/** Pondération d'un choix sur les axes (−2 … +2). */
export type PoidsAxes = Partial<Record<AxeBoussole, number>>;

export type ChoixDilemme = {
  id: string;
  label: string;
  /** Précision courte pour comprendre le sens du choix. */
  nuance: string;
  poids: PoidsAxes;
};

export type Dilemme = {
  id: string;
  question: string;
  /** Contexte neutre : de quoi parle-t-on ? */
  contexte: string;
  /** Ce que la question cherche à éclairer (sans orienter). */
  enjeu: string;
  choix: ChoixDilemme[];
};

export const DILEMMES: Dilemme[] = [
  {
    id: "liberte_securite",
    question:
      "Face à une menace (terrorisme, criminalité, crise " +
      "sanitaire…), comment arbitrer liberté, sécurité et " +
      "procédure ?",
    contexte:
      "Les pouvoirs publics peuvent renforcer contrôles, " +
      "fichiers ou mesures d'exception. Ces outils peuvent " +
      "réduire certains risques, mais aussi restreindre les " +
      "libertés et la vie privée — ou au contraire être " +
      "refusés au nom du droit.",
    enjeu:
      "Quatre logiques distinctes : préserver les libertés, " +
      "exiger une procédure stricte, prioriser l'efficacité " +
      "opérationnelle, ou installer un contrôle durable.",
    choix: [
      {
        id: "liberte_risque",
        label: "Préserver les libertés, même si le risque reste",
        nuance:
          "Limiter au maximum les pouvoirs exceptionnels ; " +
          "accepter un niveau de risque résiduel plus élevé.",
        poids: { liberte: 2, vie_privee: 2, autorite: -2 },
      },
      {
        id: "procedure_juge",
        label: "Mesures possibles, mais seulement sous le juge",
        nuance:
          "Autoriser des outils ciblés, temporaires, sous " +
          "mandat judiciaire — la procédure prime sur la " +
          "vitesse.",
        poids: {
          liberte: 1,
          vie_privee: 1,
          autorite: 1,
          responsabilite: 1,
        },
      },
      {
        id: "efficacite_ops",
        label: "Donner vite les moyens opérationnels utiles",
        nuance:
          "Priorité à l'efficacité des forces et du " +
          "renseignement ; le contrôle politique vient " +
          "ensuite, sans tout bloquer en amont.",
        poids: {
          autorite: 2,
          intervention_etat: 1,
          liberte: -1,
          vie_privee: -1,
        },
      },
      {
        id: "controle_durable",
        label: "Installer un contrôle durable pour prévenir",
        nuance:
          "Élargir durablement les outils de prévention, " +
          "même si cela restreint durablement certaines " +
          "libertés.",
        poids: { autorite: 2, liberte: -2, vie_privee: -2 },
      },
    ],
  },
  {
    id: "egalite_merit",
    question:
      "Comment la société doit-elle traiter les inégalités " +
      "de revenus et de destin ?",
    contexte:
      "Redistribution, école, filet social, rémunérations : " +
      "plusieurs façons d'arbitrer, qui ne se réduisent pas " +
      "à « plus » ou « moins » d'égalité.",
    enjeu:
      "Quatre logiques : égaliser les conditions, égaliser " +
      "les chances, garantir un socle digne, ou laisser les " +
      "écarts refléter l'effort.",
    choix: [
      {
        id: "egalite_resultats",
        label: "Réduire fortement les écarts de condition",
        nuance:
          "Priorité à l'égalité des résultats via fiscalité " +
          "et services publics.",
        poids: {
          egalite: 2,
          solidarite: 2,
          marche: -2,
          responsabilite: -1,
        },
      },
      {
        id: "egalite_chances",
        label: "Égaliser les chances au départ, puis le mérite",
        nuance:
          "Investir lourdement dans l'école et la santé ; " +
          "accepter des écarts de revenus ensuite.",
        poids: {
          egalite: 2,
          responsabilite: 1,
          solidarite: 1,
        },
      },
      {
        id: "socle_digne",
        label: "Garantir un socle digne, sans viser l'égalité",
        nuance:
          "Un minimum social robuste pour tous ; au-delà, " +
          "ne pas chercher à compresser les revenus.",
        poids: {
          solidarite: 2,
          responsabilite: 1,
          marche: 1,
        },
      },
      {
        id: "ecarts_effort",
        label: "Laisser les écarts refléter l'effort et le talent",
        nuance:
          "Limiter la redistribution ; valoriser la réussite " +
          "individuelle et le marché.",
        poids: {
          responsabilite: 2,
          marche: 2,
          egalite: -2,
          solidarite: -1,
        },
      },
    ],
  },
  {
    id: "etat_economie",
    question:
      "Quel rôle l'État doit-il jouer dans l'économie ?",
    contexte:
      "Régulation, planification, aides, nationalisations, " +
      "concurrence : plusieurs façons d'organiser l'action " +
      "publique, qui ne se réduisent pas à « plus » ou " +
      "« moins » d'État.",
    enjeu:
      "Quatre logiques : planifier, réguler les marchés, " +
      "corriger ponctuellement, ou minimiser l'intervention.",
    choix: [
      {
        id: "planifier",
        label: "Planifier et orienter les secteurs stratégiques",
        nuance:
          "Prix, investissement et filières guidés par la " +
          "puissance publique.",
        poids: {
          intervention_etat: 2,
          solidarite: 1,
          marche: -2,
        },
      },
      {
        id: "reguler",
        label: "Réguler activement, laisser produire le marché",
        nuance:
          "Concurrence utile, mais règles strictes sur " +
          "finance, travail et environnement.",
        poids: {
          intervention_etat: 1,
          marche: 1,
          responsabilite: 1,
        },
      },
      {
        id: "corriger",
        label: "Marché d'abord, État correcteur en cas d'échec",
        nuance:
          "Laisser faire la concurrence ; intervenir surtout " +
          "en crise ou défaillance manifeste.",
        poids: {
          marche: 2,
          responsabilite: 1,
          intervention_etat: -1,
        },
      },
      {
        id: "etat_minimal",
        label: "État minimal : confiance à l'autorégulation",
        nuance:
          "Réduire impôts, normes et interventions ; faire " +
          "confiance aux acteurs privés.",
        poids: {
          marche: 2,
          responsabilite: 2,
          intervention_etat: -2,
        },
      },
    ],
  },
  {
    id: "peine",
    question: "À quoi doit servir une peine de justice ?",
    contexte:
      "Prison et peines alternatives peuvent viser la " +
      "punition, la dissuasion, la protection de la société " +
      "ou la réinsertion — des finalités distinctes.",
    enjeu:
      "Quatre logiques : punir pour marquer la faute, " +
      "protéger la société, réinsérer pour éviter la " +
      "récidive, ou dissuader par la fermeté visible.",
    choix: [
      {
        id: "retribuer",
        label: "Punir pour marquer la faute",
        nuance:
          "Sanctions fermes et visibles ; la réparation " +
          "morale passe avant la réinsertion.",
        poids: { autorite: 2, responsabilite: 2, solidarite: -1 },
      },
      {
        id: "proteger",
        label: "Protéger la société des personnes dangereuses",
        nuance:
          "Incapacitation et suivi : la sécurité des " +
          "victimes et du public prime.",
        poids: {
          autorite: 2,
          responsabilite: 1,
          liberte: -1,
        },
      },
      {
        id: "reinserer",
        label: "Réinsérer pour éviter la récidive",
        nuance:
          "Accompagnement, formation, peines alternatives ; " +
          "la prison en dernier recours.",
        poids: { solidarite: 2, egalite: 1, autorite: -2 },
      },
      {
        id: "dissuader",
        label: "Dissuader par la certitude de la sanction",
        nuance:
          "Ce qui compte, c'est que la peine soit probable " +
          "et rapide, plus que sa durée maximale.",
        poids: {
          autorite: 1,
          responsabilite: 2,
          intervention_etat: 1,
        },
      },
    ],
  },
  {
    id: "ecologie_croissance",
    question:
      "Quand écologie et activité économique entrent en " +
      "tension, quelle logique suivre ?",
    contexte:
      "Normes, fiscalité carbone, projets industriels : " +
      "protéger le climat peut contraindre, réorienter ou " +
      "transformer l'activité — selon des voies très " +
      "différentes.",
    enjeu:
      "Quatre logiques : sobriété contrainte, transition " +
      "planifiée et solidaire, incitations de marché, ou " +
      "priorité à l'activité et à l'emploi.",
    choix: [
      {
        id: "sobriete",
        label: "Sobriété d'abord, même au prix de la croissance",
        nuance:
          "Accepter des contraintes fortes sur la production " +
          "et la consommation pour respecter les limites " +
          "planétaires.",
        poids: {
          ecologie: 2,
          marche: -2,
          intervention_etat: 1,
          responsabilite: 1,
        },
      },
      {
        id: "transition_planifiee",
        label: "Transition planifiée, avec compensation sociale",
        nuance:
          "L'État accélère la sortie des fossiles et " +
          "protège ménages et territoires touchés.",
        poids: {
          ecologie: 2,
          intervention_etat: 2,
          solidarite: 2,
          marche: -1,
        },
      },
      {
        id: "innovation_marche",
        label: "Prix, innovation et concurrence verte",
        nuance:
          "Signal-prix (carbone), R&D et marchés pour " +
          "décarboner sans planifier l'appareil productif.",
        poids: {
          ecologie: 1,
          marche: 2,
          responsabilite: 1,
          intervention_etat: -1,
        },
      },
      {
        id: "activite_dabord",
        label: "Emploi et compétitivité d'abord",
        nuance:
          "Éviter les normes qui pèsent trop sur l'activité ; " +
          "le progrès technique suivra.",
        poids: {
          marche: 2,
          ecologie: -2,
          responsabilite: 1,
          intervention_etat: -1,
        },
      },
    ],
  },
  {
    id: "vie_privee_transparence",
    question:
      "Pour lutter contre la fraude ou la délinquance, " +
      "jusqu'où aller dans le contrôle des données ?",
    contexte:
      "Caméras, fichiers, reconnaissance faciale, accès " +
      "aux comptes : l'efficacité du contrôle entre en " +
      "tension avec la vie privée — selon des voies " +
      "différentes.",
    enjeu:
      "Quatre logiques : interdire la surveillance de " +
      "masse, exiger le juge, élargir sous transparence, " +
      "ou maximiser le contrôle.",
    choix: [
      {
        id: "refus_masse",
        label: "Refuser la surveillance de masse",
        nuance:
          "Pas d'outils généralisés, même s'ils aident à " +
          "détecter des fraudes.",
        poids: { vie_privee: 2, liberte: 2, autorite: -2 },
      },
      {
        id: "mandat_juge",
        label: "Accès aux données seulement sous mandat",
        nuance:
          "Autoriser le cas par cas, sous contrôle " +
          "judiciaire strict.",
        poids: {
          vie_privee: 2,
          liberte: 1,
          autorite: 1,
        },
      },
      {
        id: "transparence_recours",
        label: "Élargir les fichiers, avec recours effectifs",
        nuance:
          "Accepter davantage de contrôles si l'on peut " +
          "contester et auditer les usages.",
        poids: {
          autorite: 1,
          responsabilite: 1,
          vie_privee: -1,
          intervention_etat: 1,
        },
      },
      {
        id: "controle_large",
        label: "Maximiser le contrôle pour dissuader",
        nuance:
          "Priorité à l'efficacité, quitte à collecter " +
          "plus de données.",
        poids: {
          autorite: 2,
          vie_privee: -2,
          intervention_etat: 1,
        },
      },
    ],
  },
  {
    id: "centralisation",
    question: "Où doit se prendre la décision publique ?",
    contexte:
      "État central, régions, départements, communes : " +
      "unité nationale, autonomie locale, expérimentation " +
      "ou égalité territoriale — des priorités distinctes.",
    enjeu:
      "Quatre logiques : décider au plus près, expérimenter " +
      "sous cadre national, garantir l'égalité par le " +
      "centre, ou recentraliser les compétences clés.",
    choix: [
      {
        id: "local_fort",
        label: "Décider au plus près des territoires",
        nuance:
          "Transférer budget et compétences ; accepter des " +
          "différences locales.",
        poids: {
          decentralisation: 2,
          liberte: 1,
          egalite: -1,
        },
      },
      {
        id: "experimenter",
        label: "Laisser expérimenter, avec objectifs communs",
        nuance:
          "Autonomie locale forte, mais cadre et buts " +
          "fixés nationalement.",
        poids: {
          decentralisation: 1,
          intervention_etat: 1,
          egalite: 1,
        },
      },
      {
        id: "egalite_centrale",
        label: "L'État garantit la même règle partout",
        nuance:
          "Priorité à l'égalité territoriale ; le local " +
          "exécute plus qu'il n'invente.",
        poids: {
          egalite: 2,
          intervention_etat: 1,
          decentralisation: -1,
        },
      },
      {
        id: "recentraliser",
        label: "Recentraliser les compétences stratégiques",
        nuance:
          "Unité de décision sur l'essentiel ; limiter le " +
          "mitage des politiques publiques.",
        poids: {
          decentralisation: -2,
          autorite: 1,
          intervention_etat: 2,
        },
      },
    ],
  },
  {
    id: "solidarite_responsabilite",
    question:
      "Face à la précarité, quelle logique d'aide publique ?",
    contexte:
      "Minima sociaux, RSA, aides au logement : montant, " +
      "conditions, accompagnement ou sanction — plusieurs " +
      "architectures possibles.",
    enjeu:
      "Quatre logiques : droit inconditionnel, " +
      "accompagnement sans sanction, contrepartie " +
      "vérifiée, ou aide temporaire strictement liée à " +
      "l'effort.",
    choix: [
      {
        id: "inconditionnel",
        label: "Un droit à un revenu digne, sans contrepartie",
        nuance:
          "Garantir le socle d'abord ; la conditionnalité " +
          "n'est pas le levier principal.",
        poids: {
          solidarite: 2,
          egalite: 2,
          responsabilite: -2,
        },
      },
      {
        id: "accompagner",
        label: "Aides généreuses + accompagnement, pas de sanction",
        nuance:
          "Soutenir fortement et proposer un parcours, " +
          "sans punir d'emblée.",
        poids: {
          solidarite: 2,
          egalite: 1,
          responsabilite: 1,
        },
      },
      {
        id: "contrepartie",
        label: "Filet maintenu, contreparties vérifiées",
        nuance:
          "Lier le versement à des démarches contrôlées " +
          "(emploi, formation).",
        poids: {
          responsabilite: 2,
          solidarite: 1,
          autorite: 1,
        },
      },
      {
        id: "tremplin",
        label: "Aide temporaire : tremplin, pas statut durable",
        nuance:
          "Réduire l'aide sans effort démontré ; " +
          "responsabiliser rapidement.",
        poids: {
          responsabilite: 2,
          marche: 1,
          solidarite: -2,
        },
      },
    ],
  },
  {
    id: "immigration",
    question:
      "Quelle orientation pour la politique migratoire ?",
    contexte:
      "Asile, immigration de travail, régularisations, " +
      "frontières : hospitalité, voies légales, besoins " +
      "économiques ou contrôle — des priorités distinctes.",
    enjeu:
      "Quatre logiques : hospitalité large, voies légales " +
      "organisées, sélection par le travail, ou priorité " +
      "au contrôle des frontières.",
    choix: [
      {
        id: "hospitalite",
        label: "Accueil large, droits étendus rapidement",
        nuance:
          "Faciliter l'entrée et l'intégration ; prioriser " +
          "l'hospitalité.",
        poids: {
          solidarite: 2,
          egalite: 1,
          autorite: -2,
          liberte: 1,
        },
      },
      {
        id: "voies_legales",
        label: "Ouvrir des voies légales claires et tenables",
        nuance:
          "Asile effectif et canaux organisés, plutôt que " +
          "laisser les flux dans l'informel.",
        poids: {
          solidarite: 1,
          responsabilite: 1,
          autorite: 1,
          egalite: 1,
        },
      },
      {
        id: "selection_travail",
        label: "Sélectionner surtout selon les besoins économiques",
        nuance:
          "Priorité aux métiers en tension et aux " +
          "compétences ; asile traité à part.",
        poids: {
          marche: 2,
          responsabilite: 1,
          autorite: 1,
          solidarite: -1,
        },
      },
      {
        id: "frontieres",
        label: "Priorité au contrôle et à la réduction des flux",
        nuance:
          "Durcir entrées et séjour ; accélérer les " +
          "éloignements en cas de refus.",
        poids: {
          autorite: 2,
          solidarite: -1,
          liberte: -1,
        },
      },
    ],
  },
  {
    id: "laicite",
    question:
      "Comment l'État doit-il traiter le fait religieux " +
      "dans l'espace public ?",
    contexte:
      "École, fonction publique, rue, associations : la " +
      "laïcité peut viser la liberté de conscience, la " +
      "neutralité des agents, un espace commun sans " +
      "marqueurs, ou une unité républicaine stricte.",
    enjeu:
      "Quatre logiques : maximiser la liberté visible, " +
      "neutralité des seuls agents, cadre strict à " +
      "l'école, ou neutralité étendue aux usagers.",
    choix: [
      {
        id: "liberte_visible",
        label: "Maximiser la liberté religieuse visible",
        nuance:
          "Limiter les interdits de signes ; privilégier " +
          "l'expression des convictions.",
        poids: { liberte: 2, egalite: 1, autorite: -1 },
      },
      {
        id: "agents_neutres",
        label: "Neutralité des agents, liberté pour les usagers",
        nuance:
          "Fonction publique neutre ; rue et usagers plus " +
          "libres.",
        poids: {
          liberte: 1,
          egalite: 1,
          autorite: 1,
        },
      },
      {
        id: "ecole_commune",
        label: "Cadre strict surtout à l'école et lieux structurants",
        nuance:
          "Préserver un espace commun sans marqueurs " +
          "religieux là où l'on forme le citoyen.",
        poids: {
          autorite: 1,
          egalite: 1,
          liberte: -1,
          intervention_etat: 1,
        },
      },
      {
        id: "neutralite_etendue",
        label: "Neutralité stricte, y compris pour les usagers",
        nuance:
          "Restreindre les signes religieux dans davantage " +
          "d'espaces publics.",
        poids: { autorite: 2, liberte: -2 },
      },
    ],
  },
  {
    id: "logement",
    question: "Comment rendre le logement plus accessible ?",
    contexte:
      "Pénurie et prix élevés : logement social, " +
      "encadrement des loyers, aides à la demande, ou " +
      "libération de l'offre — des leviers distincts.",
    enjeu:
      "Quatre logiques : droit garanti par l'État, " +
      "régulation des loyers + offre publique, aides " +
      "ciblées + offre privée, ou marché producteur.",
    choix: [
      {
        id: "droit_logement",
        label: "Traiter le logement comme un droit garanti",
        nuance:
          "HLM, encadrement fort, outils de réquisition si " +
          "nécessaire.",
        poids: {
          solidarite: 2,
          egalite: 2,
          intervention_etat: 2,
          marche: -2,
        },
      },
      {
        id: "reguler_loyers",
        label: "Construire du public et réguler les loyers",
        nuance:
          "Investir massivement et encadrer les abus du " +
          "marché locatif.",
        poids: {
          solidarite: 1,
          egalite: 1,
          intervention_etat: 2,
          marche: -1,
        },
      },
      {
        id: "aides_offre",
        label: "Aider les ménages et libérer l'offre privée",
        nuance:
          "Simplifier les normes, soutenir la demande " +
          "modeste sans figer tous les prix.",
        poids: {
          marche: 1,
          responsabilite: 1,
          solidarite: 1,
          intervention_etat: -1,
        },
      },
      {
        id: "marche_immo",
        label: "Laisser le marché produire l'offre",
        nuance:
          "Moins de contraintes sur construction et loyers ; " +
          "confiance aux promoteurs.",
        poids: {
          marche: 2,
          intervention_etat: -2,
          egalite: -1,
        },
      },
    ],
  },
  {
    id: "sante",
    question:
      "Comment financer et organiser le système de santé ?",
    contexte:
      "Assurance maladie, hôpital public, privé lucratif, " +
      "reste à charge : plusieurs architectures du " +
      "modèle mixte.",
    enjeu:
      "Quatre logiques : service public quasi total, socle " +
      "public + privé régulé, concurrence avec filet, ou " +
      "orientation marché / assurance.",
    choix: [
      {
        id: "sante_publique",
        label: "Santé surtout publique et peu de reste à charge",
        nuance:
          "Renforcer l'hôpital public ; réduire le privé " +
          "lucratif.",
        poids: {
          solidarite: 2,
          egalite: 2,
          intervention_etat: 2,
          marche: -2,
        },
      },
      {
        id: "socle_regule",
        label: "Socle public solide, privé complémentaire régulé",
        nuance:
          "Accès garanti pour tous ; privé sous contrôles.",
        poids: {
          solidarite: 2,
          egalite: 1,
          intervention_etat: 1,
          marche: -1,
        },
      },
      {
        id: "choix_filet",
        label: "Plus de choix, avec un filet universel",
        nuance:
          "Concurrence et assurances, sans laisser personne " +
          "sans soins.",
        poids: {
          marche: 1,
          responsabilite: 1,
          solidarite: 1,
          liberte: 1,
        },
      },
      {
        id: "sante_marche",
        label: "Orientation marché : assurance et offre privée",
        nuance:
          "Responsabiliser les patients ; réduire le rôle " +
          "de l'État financeur unique.",
        poids: {
          marche: 2,
          responsabilite: 2,
          solidarite: -1,
          intervention_etat: -2,
        },
      },
    ],
  },
  {
    id: "europe",
    question:
      "Quel degré d'intégration européenne souhaitez-vous ?",
    contexte:
      "Budget, dette, défense, normes : l'UE peut " +
      "fédéraliser, intégrer par priorités, rester une " +
      "coopération, ou rendre des compétences.",
    enjeu:
      "Quatre logiques : Europe politique, intégration " +
      "ciblée, Europe des nations, ou reprise de " +
      "compétences nationales.",
    choix: [
      {
        id: "federal",
        label: "Plus d'Europe politique et budgétaire",
        nuance:
          "Transférer davantage de pouvoirs pour agir à " +
          "l'échelle continentale.",
        poids: {
          intervention_etat: 1,
          egalite: 1,
          decentralisation: -1,
          solidarite: 1,
        },
      },
      {
        id: "priorites",
        label: "S'intégrer surtout sur quelques priorités",
        nuance:
          "Climat, défense, industrie : avancer ensemble " +
          "sans tout fédéraliser.",
        poids: {
          intervention_etat: 1,
          ecologie: 1,
          autorite: 1,
        },
      },
      {
        id: "nations",
        label: "Europe des nations : coopération sans transferts",
        nuance:
          "Marché commun et accords ; veto national sur " +
          "l'essentiel.",
        poids: {
          liberte: 1,
          marche: 1,
          decentralisation: 1,
          intervention_etat: -1,
        },
      },
      {
        id: "reprise",
        label: "Reprendre des compétences nationales",
        nuance:
          "Limiter le droit européen ; prioriser la " +
          "souveraineté de l'État.",
        poids: {
          autorite: 2,
          decentralisation: 1,
          marche: -1,
        },
      },
    ],
  },
  {
    id: "education",
    question: "Quelle priorité pour l'école ?",
    contexte:
      "Mixité, moyens, excellence, autonomie, sélection : " +
      "l'école traduit des conceptions distinctes de " +
      "l'égalité et du mérite.",
    enjeu:
      "Quatre logiques : égaliser les parcours, soutenir " +
      "sans uniformiser, autonomie / excellence, ou " +
      "sélection précoce.",
    choix: [
      {
        id: "parcours_egaux",
        label: "Égaliser fortement parcours et moyens",
        nuance:
          "Mixité, compensation territoriale, même cadre " +
          "pour tous.",
        poids: {
          egalite: 2,
          solidarite: 2,
          responsabilite: -1,
          liberte: -1,
        },
      },
      {
        id: "soutien",
        label: "Égalité des chances + soutien renforcé",
        nuance:
          "Aider les élèves en difficulté sans supprimer " +
          "toute différenciation.",
        poids: {
          egalite: 2,
          solidarite: 1,
          responsabilite: 1,
        },
      },
      {
        id: "autonomie",
        label: "Autonomie des établissements et parcours variés",
        nuance:
          "Liberté pédagogique, projets d'école, " +
          "différenciation assumée.",
        poids: {
          liberte: 2,
          responsabilite: 1,
          decentralisation: 1,
          egalite: -1,
        },
      },
      {
        id: "selection",
        label: "Sélection et mérite dès que pertinent",
        nuance:
          "Orientation précoce, compétition, " +
          "responsabilité des familles et des élèves.",
        poids: {
          responsabilite: 2,
          liberte: 1,
          egalite: -2,
          marche: 1,
        },
      },
    ],
  },
  {
    id: "travail",
    question: "Comment organiser le droit du travail ?",
    contexte:
      "CDI, licenciements, durée du travail, ubérisation : " +
      "protéger le statut, sécuriser les parcours, " +
      "flexibiliser l'emploi ou libérer le contrat — des " +
      "architectures distinctes.",
    enjeu:
      "Quatre logiques : protéger le salariat, sécuriser " +
      "les transitions, flexibilité + filet, ou contrats " +
      "très libres.",
    choix: [
      {
        id: "proteger_statut",
        label: "Protéger fortement le statut salarié",
        nuance:
          "Durcir licenciements ; limiter la précarité " +
          "contractuelle.",
        poids: {
          solidarite: 2,
          egalite: 1,
          marche: -2,
          intervention_etat: 2,
        },
      },
      {
        id: "securiser_parcours",
        label: "Sécuriser les parcours plus que le poste",
        nuance:
          "Formation, droits rechargeables, accompagnement " +
          "entre deux emplois.",
        poids: {
          solidarite: 2,
          responsabilite: 1,
          egalite: 1,
          marche: -1,
        },
      },
      {
        id: "flex_filet",
        label: "Flexibilité de l'emploi, filet de sécurité fort",
        nuance:
          "Faciliter embauches et ruptures ; compenser par " +
          "chômage et formation.",
        poids: {
          marche: 1,
          responsabilite: 1,
          solidarite: 1,
          intervention_etat: 1,
        },
      },
      {
        id: "contrats_libres",
        label: "Contrats libres, peu de contraintes",
        nuance:
          "Responsabiliser salarié et employeur ; réduire " +
          "le droit du travail.",
        poids: {
          marche: 2,
          responsabilite: 2,
          solidarite: -1,
          intervention_etat: -2,
        },
      },
    ],
  },
  /*
   * Dilemmes 16 à 19 : renforcent les axes que le questionnaire
   * mesurait mal (écologie et vie privée : 2 dilemmes chacun,
   * décentralisation : 3). Sur chaque axe visé, la somme des poids
   * des quatre choix est nulle : répondre au hasard ne pousse
   * l'axe ni d'un côté ni de l'autre.
   */
  {
    id: "transition_quotidien",
    question:
      "Pour réduire les émissions liées à la vie quotidienne " +
      "(voiture, chauffage, alimentation), quelle logique suivre ?",
    contexte:
      "Transports, logement et alimentation pèsent lourd dans " +
      "les émissions. Les changer touche directement le budget " +
      "et les habitudes des ménages, inégalement selon les " +
      "revenus et les territoires.",
    enjeu:
      "Quatre logiques : fixer des règles, donner un prix au " +
      "carbone, protéger d'abord le pouvoir d'achat, ou laisser " +
      "chacun choisir son mode de vie.",
    choix: [
      {
        id: "normes_calendrier",
        label: "Fixer des normes et un calendrier pour tous",
        nuance:
          "Interdire progressivement les pratiques les plus " +
          "émettrices ; la règle s'applique à tous.",
        poids: {
          ecologie: 2,
          intervention_etat: 2,
          autorite: 1,
          liberte: -1,
        },
      },
      {
        id: "prix_carbone",
        label: "Donner un prix au carbone, chacun s'adapte",
        nuance:
          "Le signal prix oriente les choix ; ménages et " +
          "entreprises arbitrent eux-mêmes.",
        poids: {
          ecologie: 1,
          marche: 2,
          responsabilite: 1,
          intervention_etat: -1,
        },
      },
      {
        id: "pouvoir_achat",
        label: "Protéger d'abord le pouvoir d'achat",
        nuance:
          "Ralentir le rythme tant que les ménages modestes " +
          "n'ont pas d'alternative abordable.",
        poids: {
          solidarite: 2,
          egalite: 1,
          intervention_etat: 1,
          ecologie: -1,
        },
      },
      {
        id: "libre_mode_vie",
        label: "Ne pas imposer de changement de mode de vie",
        nuance:
          "Informer, mais laisser chacun libre de ses " +
          "déplacements, de son logement et de son assiette.",
        poids: {
          liberte: 2,
          responsabilite: 1,
          intervention_etat: -1,
          ecologie: -2,
        },
      },
    ],
  },
  {
    id: "amenagement_nature",
    question:
      "Quand un projet d'aménagement (usine, route, retenue " +
      "d'eau…) menace un milieu naturel, qui tranche et comment ?",
    contexte:
      "Un projet peut créer des emplois ou répondre à un besoin " +
      "local tout en détruisant des terres, des zones humides ou " +
      "des espèces. Habitants, élus locaux et État n'ont pas " +
      "toujours le même avis.",
    enjeu:
      "Quatre logiques : protéger le milieu, laisser décider les " +
      "habitants, réaliser en compensant, ou faire primer " +
      "l'intérêt national.",
    choix: [
      {
        id: "proteger_milieu",
        label: "Protéger le milieu, quitte à renoncer au projet",
        nuance:
          "Un milieu détruit ne se remplace pas ; le projet " +
          "doit trouver une autre forme ou un autre lieu.",
        poids: {
          ecologie: 2,
          intervention_etat: 1,
          marche: -1,
        },
      },
      {
        id: "habitants_decident",
        label: "Laisser les habitants concernés décider",
        nuance:
          "Consultation locale décisive : ceux qui vivent sur " +
          "place arbitrent entre emploi et environnement.",
        poids: {
          decentralisation: 2,
          liberte: 1,
          autorite: -1,
        },
      },
      {
        id: "compenser",
        label: "Réaliser le projet en compensant ailleurs",
        nuance:
          "Le porteur du projet finance la restauration d'un " +
          "milieu équivalent.",
        poids: {
          marche: 1,
          responsabilite: 1,
          ecologie: -1,
        },
      },
      {
        id: "interet_national",
        label: "L'État tranche selon l'intérêt national",
        nuance:
          "Les projets jugés stratégiques ne doivent pas être " +
          "bloqués localement.",
        poids: {
          autorite: 2,
          intervention_etat: 1,
          decentralisation: -2,
          ecologie: -1,
        },
      },
    ],
  },
  {
    id: "donnees_numeriques",
    question:
      "Que peut-on faire des données personnelles collectées " +
      "par les services numériques ?",
    contexte:
      "Applications, réseaux sociaux, objets connectés et " +
      "services de santé collectent beaucoup de données. Elles " +
      "financent des services gratuits, peuvent servir la " +
      "recherche, et exposent aussi la vie privée.",
    enjeu:
      "Quatre logiques : encadrer strictement, outiller chacun, " +
      "mutualiser pour l'intérêt général, ou laisser l'échange " +
      "se faire librement.",
    choix: [
      {
        id: "consentement_strict",
        label: "Consentement explicite et collecte minimale",
        nuance:
          "Interdire par défaut le ciblage et la revente ; " +
          "une autorité publique contrôle.",
        poids: {
          vie_privee: 2,
          intervention_etat: 1,
          marche: -1,
        },
      },
      {
        id: "outiller_individus",
        label: "Outiller chacun pour qu'il décide lui-même",
        nuance:
          "Transparence, portabilité et réglages simples ; à " +
          "chacun de choisir ce qu'il partage.",
        poids: {
          responsabilite: 2,
          liberte: 1,
          vie_privee: 1,
          intervention_etat: -1,
        },
      },
      {
        id: "donnees_communes",
        label: "Mutualiser les données pour l'intérêt général",
        nuance:
          "Santé, transport, recherche : des données partagées " +
          "par défaut, avec un droit de retrait.",
        poids: {
          solidarite: 2,
          intervention_etat: 1,
          vie_privee: -1,
        },
      },
      {
        id: "echange_libre",
        label: "Laisser échanger ses données contre des services",
        nuance:
          "Un service gratuit financé par les données est un " +
          "contrat que chacun peut accepter.",
        poids: {
          marche: 2,
          liberte: 1,
          vie_privee: -2,
        },
      },
    ],
  },
  {
    id: "verification_age",
    question:
      "Pour protéger les mineurs en ligne (réseaux sociaux, " +
      "contenus pour adultes), faut-il vérifier l'âge ou " +
      "l'identité des utilisateurs ?",
    contexte:
      "Les mineurs accèdent tôt aux réseaux sociaux et à des " +
      "contenus inadaptés. Vérifier l'âge peut les protéger, mais " +
      "suppose de contrôler aussi les adultes et de lever une " +
      "part d'anonymat.",
    enjeu:
      "Quatre logiques : préserver l'anonymat, s'en remettre aux " +
      "familles, vérifier l'âge sans révéler l'identité, ou " +
      "exiger une identité vérifiée.",
    choix: [
      {
        id: "anonymat_preserve",
        label: "Préserver l'anonymat, éduquer plutôt que contrôler",
        nuance:
          "Aucune vérification généralisée ; miser sur " +
          "l'éducation et la modération des plateformes.",
        poids: {
          vie_privee: 2,
          liberte: 2,
          autorite: -1,
        },
      },
      {
        id: "familles_decident",
        label: "S'en remettre aux familles",
        nuance:
          "Outils de contrôle parental efficaces ; les parents " +
          "fixent les règles, pas l'État.",
        poids: {
          responsabilite: 2,
          liberte: 1,
          intervention_etat: -1,
        },
      },
      {
        id: "tiers_confiance",
        label: "Vérifier l'âge sans révéler l'identité",
        nuance:
          "Un tiers de confiance atteste l'âge ; la plateforme " +
          "ne sait pas qui vous êtes.",
        poids: {
          autorite: 1,
          intervention_etat: 1,
        },
      },
      {
        id: "identite_verifiee",
        label: "Exiger une identité vérifiée",
        nuance:
          "Lever l'anonymat sur les grandes plateformes pour " +
          "protéger les mineurs et responsabiliser les usages.",
        poids: {
          autorite: 2,
          responsabilite: 1,
          liberte: -1,
          vie_privee: -2,
        },
      },
    ],
  },
];

export type ProfilBoussole = Record<AxeBoussole, number>;

/**
 * Axes les plus marqués d'un dilemme (tous les choix),
 * pour afficher un contexte court pendant le quiz.
 */
export function axesPrincipauxDuDilemme(
  dilemme: Dilemme,
  max = 3,
): AxeBoussole[] {
  const scores = new Map<AxeBoussole, number>();
  for (const choix of dilemme.choix) {
    for (const [axe, poids] of Object.entries(choix.poids)) {
      const a = axe as AxeBoussole;
      const abs = Math.abs(poids ?? 0);
      if (abs === 0) continue;
      scores.set(a, Math.max(scores.get(a) ?? 0, abs));
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([axe]) => axe);
}

export type FiabiliteAxe = "faible" | "moyenne" | "bonne";

export type DetailAxe = {
  /** Position sur l'axe, −1 … +1 (0 = milieu de l'étendue possible). */
  valeur: number;
  /** Dilemmes répondus dont au moins un choix touche cet axe. */
  dilemmes: number;
  fiabilite: FiabiliteAxe;
};

export type ProfilDetaille = Record<AxeBoussole, DetailAxe>;

/**
 * Poids minimal et maximal qu'un dilemme peut donner à un axe
 * (un choix qui ne mentionne pas l'axe compte pour 0), ou null si
 * aucun choix du dilemme ne touche l'axe.
 */
function etendueAxe(
  dilemme: Dilemme,
  axe: AxeBoussole,
): { min: number; max: number } | null {
  if (!dilemme.choix.some((c) => c.poids[axe])) return null;
  const poids = dilemme.choix.map((c) => c.poids[axe] ?? 0);
  return { min: Math.min(...poids), max: Math.max(...poids) };
}

function fiabiliteDe(dilemmes: number): FiabiliteAxe {
  if (dilemmes >= 5) return "bonne";
  if (dilemmes >= 3) return "moyenne";
  return "faible";
}

/**
 * Profil détaillé : pour chaque axe, la somme des poids choisis est
 * replacée dans l'étendue que les dilemmes répondus permettaient
 * d'atteindre sur cet axe (−1 = le minimum possible, +1 = le maximum,
 * 0 = le milieu).
 *
 * Deux biais de l'ancienne moyenne sont ainsi corrigés :
 * - ne pas choisir une réponse qui touche l'axe compte (pour 0), au
 *   lieu d'être ignoré : un seul choix ne suffit plus à saturer l'axe ;
 * - un axe que les dilemmes valorisent bien plus souvent qu'ils ne le
 *   minorent (ex. responsabilité) n'est plus positif pour presque tout
 *   le monde : son 0 est le milieu de ce que le questionnaire permet.
 */
export function computeProfilDetaille(
  reponses: Record<string, string>,
): ProfilDetaille {
  const detail = {} as ProfilDetaille;
  for (const axe of AXES_BOUSSOLE) {
    let score = 0;
    let min = 0;
    let max = 0;
    let dilemmes = 0;
    for (const dilemme of DILEMMES) {
      const choix = dilemme.choix.find(
        (c) => c.id === reponses[dilemme.id],
      );
      if (!choix) continue;
      const etendue = etendueAxe(dilemme, axe);
      if (!etendue) continue;
      score += choix.poids[axe] ?? 0;
      min += etendue.min;
      max += etendue.max;
      dilemmes += 1;
    }
    const valeur =
      max > min
        ? Math.max(-1, Math.min(1, (2 * (score - min)) / (max - min) - 1))
        : 0;
    detail[axe] = { valeur, dilemmes, fiabilite: fiabiliteDe(dilemmes) };
  }
  return detail;
}

/** Ne garde que la position de chaque axe d'un profil détaillé. */
export function profilDepuisDetail(
  detail: ProfilDetaille,
): ProfilBoussole {
  const profil = {} as ProfilBoussole;
  for (const axe of AXES_BOUSSOLE) profil[axe] = detail[axe].valeur;
  return profil;
}

/** Agrège les choix en profil normalisé (−1 … +1). */
export function computeProfil(
  reponses: Record<string, string>,
): ProfilBoussole {
  return profilDepuisDetail(computeProfilDetaille(reponses));
}

/** Similarité cosinus entre deux profils. */
export function similariteProfil(
  a: ProfilBoussole,
  b: Record<AxeBoussole, number>,
): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const axe of AXES_BOUSSOLE) {
    dot += a[axe] * b[axe];
    na += a[axe] * a[axe];
    nb += b[axe] * b[axe];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
