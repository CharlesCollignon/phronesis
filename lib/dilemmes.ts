/**
 * Dilemmes et axes de la Boussole Phronesis.
 * Pas de question gauche/droite — uniquement des arbitrages de valeurs.
 * Chaque dilemme propose 4 choix gradués (pas un binaire).
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

export const AXE_BOUSSOLE_HINTS: Record<AxeBoussole, string> = {
  liberte:
    "Marge de manœuvre de l'individu face aux règles collectives.",
  egalite:
    "Réduction des écarts de condition ou d'accès aux droits.",
  solidarite:
    "Mutualisation des risques et devoirs envers les plus vulnérables.",
  responsabilite:
    "Poids accordé à l'effort, aux choix et aux conséquences individuelles.",
  autorite:
    "Rôle de l'ordre, de la contrainte et des institutions de contrôle.",
  vie_privee:
    "Protection des données personnelles et de l'intimité.",
  ecologie:
    "Préservation du vivant et des générations futures.",
  intervention_etat:
    "Degré d'action publique dans l'économie et la société.",
  marche:
    "Confiance dans la concurrence et les mécanismes de prix.",
  decentralisation:
    "Proximité des décisions (communes, régions) vs pouvoir central.",
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

/** Interpole deux profils de poids (0 = pôle A, 1 = pôle B). */
function lerpPoids(
  a: PoidsAxes,
  b: PoidsAxes,
  t: number,
): PoidsAxes {
  const keys = new Set([
    ...Object.keys(a),
    ...Object.keys(b),
  ]) as Set<AxeBoussole>;
  const out: PoidsAxes = {};
  for (const k of keys) {
    const va = a[k] ?? 0;
    const vb = b[k] ?? 0;
    out[k] = Math.round((va + (vb - va) * t) * 10) / 10;
  }
  return out;
}

function spectreQuatre(opts: {
  id: string;
  question: string;
  contexte: string;
  enjeu: string;
  poleA: { id: string; label: string; nuance: string; poids: PoidsAxes };
  midA: { label: string; nuance: string };
  midB: { label: string; nuance: string };
  poleB: { id: string; label: string; nuance: string; poids: PoidsAxes };
}): Dilemme {
  return {
    id: opts.id,
    question: opts.question,
    contexte: opts.contexte,
    enjeu: opts.enjeu,
    choix: [
      {
        id: `${opts.poleA.id}_fort`,
        label: opts.poleA.label,
        nuance: opts.poleA.nuance,
        poids: opts.poleA.poids,
      },
      {
        id: `${opts.poleA.id}_modere`,
        label: opts.midA.label,
        nuance: opts.midA.nuance,
        poids: lerpPoids(opts.poleA.poids, opts.poleB.poids, 0.33),
      },
      {
        id: `${opts.poleB.id}_modere`,
        label: opts.midB.label,
        nuance: opts.midB.nuance,
        poids: lerpPoids(opts.poleA.poids, opts.poleB.poids, 0.66),
      },
      {
        id: `${opts.poleB.id}_fort`,
        label: opts.poleB.label,
        nuance: opts.poleB.nuance,
        poids: opts.poleB.poids,
      },
    ],
  };
}

export const DILEMMES: Dilemme[] = [
  spectreQuatre({
    id: "liberte_securite",
    question:
      "Face à une menace (terrorisme, criminalité, crise " +
      "sanitaire…), comment arbitrer entre liberté et sécurité ?",
    contexte:
      "Les pouvoirs publics peuvent renforcer contrôles, " +
      "fichiers ou mesures d'exception. Ces outils peuvent " +
      "réduire certains risques, mais aussi restreindre les " +
      "libertés et la vie privée.",
    enjeu:
      "On mesure ici votre tolérance à la contrainte publique " +
      "lorsqu'elle est justifiée par la sécurité collective.",
    poleA: {
      id: "liberte",
      label: "Liberté d'abord, même en période de tension",
      nuance:
        "Limiter au maximum les pouvoirs exceptionnels ; " +
        "accepter un niveau de risque plus élevé.",
      poids: { liberte: 2, vie_privee: 2, autorite: -2 },
    },
    midA: {
      label: "Liberté prioritaire, avec contrôles ciblés et limités",
      nuance:
        "Accepter des mesures précises, temporaires et " +
        "contrôlées par le juge.",
    },
    midB: {
      label: "Sécurité renforcée, avec garde-fous clairs",
      nuance:
        "Élargir les moyens de l'État, mais avec plafonds, " +
        "durée limitée et contrôle parlementaire.",
    },
    poleB: {
      id: "securite",
      label: "Sécurité d'abord, quitte à restreindre des libertés",
      nuance:
        "Donner la priorité à la prévention des risques, " +
        "même si cela élargit durablement le contrôle public.",
      poids: { autorite: 2, liberte: -2, vie_privee: -1 },
    },
  }),
  spectreQuatre({
    id: "egalite_merit",
    question:
      "Comment la société doit-elle traiter les inégalités " +
      "de revenus et de destin ?",
    contexte:
      "Certains défendent une redistribution forte pour " +
      "égaliser les conditions ; d'autres jugent que " +
      "l'effort et le talent doivent davantage se traduire " +
      "dans les rémunérations.",
    enjeu:
      "On explore le poids relatif de l'égalité et de la " +
      "responsabilité individuelle.",
    poleA: {
      id: "egalite",
      label: "Réduire fortement les écarts de condition",
      nuance:
        "Priorité à l'égalité des résultats via fiscalité " +
        "et services publics.",
      poids: { egalite: 2, solidarite: 2, marche: -2, responsabilite: -1 },
    },
    midA: {
      label: "Égaliser surtout les chances, puis laisser jouer le mérite",
      nuance:
        "Investir dans l'école et la santé, tout en acceptant " +
        "des écarts de revenus ensuite.",
    },
    midB: {
      label: "Récompenser le mérite, avec un filet de sécurité",
      nuance:
        "Accepter des inégalités liées à l'effort, tout en " +
        "garantissant un minimum social.",
    },
    poleB: {
      id: "merit",
      label: "Laisser les écarts refléter l'effort et le talent",
      nuance:
        "Limiter la redistribution ; valoriser la réussite " +
        "individuelle.",
      poids: { responsabilite: 2, marche: 2, egalite: -2, solidarite: -1 },
    },
  }),
  spectreQuatre({
    id: "etat_economie",
    question:
      "Quel rôle l'État doit-il jouer dans l'économie ?",
    contexte:
      "Régulation des marchés, nationalisations, aides aux " +
      "entreprises, concurrence : le débat porte sur le " +
      "degré d'intervention publique souhaitable.",
    enjeu:
      "On situe votre préférence entre planification / " +
      "régulation et logique de marché.",
    poleA: {
      id: "etat",
      label: "État très présent : planifier et réguler fortement",
      nuance:
        "Prix, secteurs stratégiques et investissement public " +
        "guidés par la puissance publique.",
      poids: {
        intervention_etat: 2,
        solidarite: 1,
        marche: -2,
      },
    },
    midA: {
      label: "État régulateur actif, marchés encadrés",
      nuance:
        "Concurrence utile, mais règles strictes sur finance, " +
        "travail et environnement.",
    },
    midB: {
      label: "Marché prioritaire, État en correcteur ponctuel",
      nuance:
        "Laisser faire la concurrence ; intervenir surtout " +
        "en cas de crise ou d'échec manifeste.",
    },
    poleB: {
      id: "marche",
      label: "État minimal : laisser le marché s'autoréguler",
      nuance:
        "Réduire impôts, normes et interventions ; faire " +
        "confiance aux acteurs privés.",
      poids: {
        marche: 2,
        responsabilite: 1,
        intervention_etat: -2,
      },
    },
  }),
  spectreQuatre({
    id: "peine",
    question:
      "À quoi doit servir une peine de justice ?",
    contexte:
      "La prison et les peines alternatives peuvent viser " +
      "la punition, la dissuasion, la protection de la " +
      "société ou la réinsertion du condamné.",
    enjeu:
      "On interroge l'équilibre entre autorité punitive et " +
      "solidarité / réhabilitation.",
    poleA: {
      id: "punir",
      label: "Punir avant tout, pour marquer la faute",
      nuance:
        "Sanctions fermes et visibles ; la réinsertion " +
        "vient ensuite, si elle vient.",
      poids: { autorite: 2, responsabilite: 2, solidarite: -1 },
    },
    midA: {
      label: "Punir, tout en préparant activement la sortie",
      nuance:
        "Peines crédibles, mais avec formation et " +
        "accompagnement pendant la détention.",
    },
    midB: {
      label: "Réinsérer d'abord, punir dans la mesure nécessaire",
      nuance:
        "Privilégier peines alternatives et suivi, réserver " +
        "la prison aux cas graves.",
    },
    poleB: {
      id: "reinserer",
      label: "Réinsérer avant tout ; limiter la prison",
      nuance:
        "La peine vise surtout à éviter la récidive par " +
        "l'accompagnement social.",
      poids: { solidarite: 2, egalite: 1, autorite: -2 },
    },
  }),
  spectreQuatre({
    id: "ecologie_croissance",
    question:
      "Quand écologie et activité économique entrent en " +
      "tension, que prioriser ?",
    contexte:
      "Normes environnementales, fiscalité carbone, projets " +
      "industriels : protéger le climat peut ralentir ou " +
      "réorienter certaines activités.",
    enjeu:
      "On mesure le poids relatif de l'écologie face au " +
      "marché et à la croissance.",
    poleA: {
      id: "ecologie",
      label: "Écologie d'abord, même au prix de la croissance",
      nuance:
        "Accepter des contraintes fortes sur la production " +
        "et la consommation.",
      poids: { ecologie: 2, marche: -2, intervention_etat: 1 },
    },
    midA: {
      label: "Transition rapide, avec compensations sociales",
      nuance:
        "Accélérer la sortie des énergies fossiles en " +
        "protégeant les ménages et territoires touchés.",
    },
    midB: {
      label: "Transition progressive, compatible avec la compétitivité",
      nuance:
        "Avancer sans fragiliser l'emploi ni l'industrie " +
        "nationale.",
    },
    poleB: {
      id: "croissance",
      label: "Croissance et emploi d'abord ; écologie ensuite",
      nuance:
        "Éviter les normes qui pèsent trop sur l'activité ; " +
        "miser sur le progrès technique.",
      poids: { marche: 2, ecologie: -2, responsabilite: 1 },
    },
  }),
  spectreQuatre({
    id: "vie_privee_transparence",
    question:
      "Pour lutter contre la fraude ou la délinquance, " +
      "jusqu'où aller dans le contrôle des données ?",
    contexte:
      "Caméras, accès aux comptes bancaires, reconnaissance " +
      "faciale, croisement de fichiers : l'efficacité du " +
      "contrôle entre souvent en conflit avec la vie privée.",
    enjeu:
      "On évalue votre priorité entre vie privée et moyens " +
      "de contrôle public.",
    poleA: {
      id: "vie_privee",
      label: "Vie privée non négociable",
      nuance:
        "Refuser les outils de surveillance de masse, même " +
        "s'ils aident à détecter des fraudes.",
      poids: { vie_privee: 2, liberte: 2, autorite: -2 },
    },
    midA: {
      label: "Protéger la vie privée, avec contrôles très encadrés",
      nuance:
        "Autoriser l'accès aux données au cas par cas, sous " +
        "mandat judiciaire.",
    },
    midB: {
      label: "Élargir les contrôles, avec transparence et recours",
      nuance:
        "Accepter davantage de fichiers, à condition de " +
        "pouvoir contester et vérifier les usages.",
    },
    poleB: {
      id: "surveillance",
      label: "Contrôle large pour dissuader la fraude",
      nuance:
        "Priorité à l'efficacité des contrôles, quitte à " +
        "collecter plus de données.",
      poids: {
        autorite: 2,
        vie_privee: -2,
        intervention_etat: 1,
      },
    },
  }),
  spectreQuatre({
    id: "centralisation",
    question:
      "Où doit se prendre la décision publique ?",
    contexte:
      "État central, régions, départements, communes : la " +
      "France hésite entre unité nationale et autonomie " +
      "locale.",
    enjeu:
      "On situe votre préférence pour la décentralisation " +
      "ou le pouvoir central.",
    poleA: {
      id: "local",
      label: "Décider au plus près des territoires",
      nuance:
        "Transférer budget et compétences aux collectivités ; " +
        "accepter des différences locales.",
      poids: { decentralisation: 2, liberte: 1, egalite: -1 },
    },
    midA: {
      label: "Autonomie locale forte, dans un cadre national",
      nuance:
        "Laisser expérimenter les territoires, avec des " +
        "objectifs communs fixés par l'État.",
    },
    midB: {
      label: "État garant de l'égalité, collectivités exécutantes",
      nuance:
        "Les grandes règles restent nationales ; le local " +
        "adapte la mise en œuvre.",
    },
    poleB: {
      id: "centralise",
      label: "Centraliser pour garantir l'égalité sur tout le territoire",
      nuance:
        "Une même règle partout ; limiter les écarts entre " +
        "régions riches et pauvres.",
      poids: {
        decentralisation: -2,
        egalite: 2,
        intervention_etat: 1,
      },
    },
  }),
  spectreQuatre({
    id: "solidarite_responsabilite",
    question:
      "Face à la précarité, quelle logique d'aide publique ?",
    contexte:
      "Minima sociaux, RSA, aides au logement : le débat " +
      "porte sur le montant de l'aide et les conditions " +
      "(recherche d'emploi, formation, etc.).",
    enjeu:
      "On oppose solidarité inconditionnelle et " +
      "responsabilité conditionnée.",
    poleA: {
      id: "aides",
      label: "Étendre les aides, peu ou pas de conditions",
      nuance:
        "Garantir un revenu digne sans exiger en retour une " +
        "contrepartie stricte.",
      poids: {
        solidarite: 2,
        egalite: 2,
        responsabilite: -2,
      },
    },
    midA: {
      label: "Aides généreuses, avec accompagnement plutôt que sanction",
      nuance:
        "Soutenir fortement, tout en proposant (sans " +
        "punir d'emblée) un parcours vers l'emploi.",
    },
    midB: {
      label: "Aides ciblées, clairement conditionnées",
      nuance:
        "Maintenir un filet, mais lier le versement à des " +
        "démarches vérifiées.",
    },
    poleB: {
      id: "conditionner",
      label: "Conditionner strictement ; réduire l'aide sans effort",
      nuance:
        "L'aide est un tremplin temporaire, pas un statut " +
        "durable sans activité.",
      poids: {
        responsabilite: 2,
        marche: 1,
        solidarite: -2,
      },
    },
  }),
  spectreQuatre({
    id: "immigration",
    question:
      "Quelle orientation pour la politique migratoire ?",
    contexte:
      "Accueil des demandeurs d'asile, immigration de " +
      "travail, régularisations, frontières : les choix " +
      "engagent solidarité, autorité et marché du travail.",
    enjeu:
      "On explore l'ouverture / fermeture sans cadre " +
      "partisan explicite.",
    poleA: {
      id: "accueil",
      label: "Accueil large, droits étendus rapidement",
      nuance:
        "Faciliter l'entrée et l'intégration, prioriser " +
        "l'hospitalité.",
      poids: {
        solidarite: 2,
        egalite: 1,
        autorite: -2,
        liberte: 1,
      },
    },
    midA: {
      label: "Accueil maîtrisé, voies légales renforcées",
      nuance:
        "Ouvrir des canaux clairs (asile, métiers en " +
        "tension) tout en organisant les flux.",
    },
    midB: {
      label: "Contrôle strict des entrées, accueil ciblé",
      nuance:
        "Limiter les arrivées, accélérer les éloignements " +
        "en cas de refus, sélectionner davantage.",
    },
    poleB: {
      id: "fermeture",
      label: "Fermeture prioritaire des frontières",
      nuance:
        "Réduire fortement l'immigration ; durcir les " +
        "conditions de séjour.",
      poids: {
        autorite: 2,
        solidarite: -1,
        marche: -1,
        liberte: -1,
      },
    },
  }),
  spectreQuatre({
    id: "laicite",
    question:
      "Comment l'État doit-il traiter le fait religieux " +
      "dans l'espace public ?",
    contexte:
      "École, fonction publique, associations, signes " +
      "religieux : la laïcité française peut être lue " +
      "comme neutralité stricte ou comme liberté de " +
      "conscience visible.",
    enjeu:
      "On situe l'équilibre entre liberté individuelle et " +
      "autorité / unité républicaine.",
    poleA: {
      id: "liberte_religieuse",
      label: "Maximiser la liberté religieuse visible",
      nuance:
        "Limiter les interdits de signes ; privilégier la " +
        "liberté d'expression des convictions.",
      poids: { liberte: 2, egalite: 1, autorite: -1 },
    },
    midA: {
      label: "Liberté large, neutralité surtout dans les services publics",
      nuance:
        "Agents publics neutres ; usagers et rue plus libres.",
    },
    midB: {
      label: "Neutralité étendue dans l'école et les lieux publics structurants",
      nuance:
        "Cadre plus strict pour préserver un espace commun " +
        "sans marqueurs religieux.",
    },
    poleB: {
      id: "neutralite_stricte",
      label: "Neutralité stricte, y compris pour les usagers",
      nuance:
        "Restreindre les signes religieux dans davantage " +
        "d'espaces publics.",
      poids: { autorite: 2, liberte: -2, egalite: 0 },
    },
  }),
  spectreQuatre({
    id: "logement",
    question:
      "Comment rendre le logement plus accessible ?",
    contexte:
      "Prix élevés, pénurie dans les métropoles : les leviers " +
      "vont du logement social et de l'encadrement des loyers " +
      "à la déréglementation de la construction.",
    enjeu:
      "On oppose intervention publique / solidarité et " +
      "logique de marché immobilier.",
    poleA: {
      id: "public",
      label: "Forte intervention : HLM, encadrement, réquisition",
      nuance:
        "Traiter le logement comme un droit garanti par " +
        "l'État.",
      poids: {
        solidarite: 2,
        egalite: 2,
        intervention_etat: 2,
        marche: -2,
      },
    },
    midA: {
      label: "Mix : construction publique + régulation des loyers",
      nuance:
        "Investir massivement tout en encadrant les abus " +
        "du marché locatif.",
    },
    midB: {
      label: "Libérer surtout l'offre privée, avec aides ciblées",
      nuance:
        "Simplifier les normes, aider les ménages modestes " +
        "sans figer les prix.",
    },
    poleB: {
      id: "marche_immo",
      label: "Laisser le marché produire l'offre",
      nuance:
        "Moins de contraintes sur la construction et les " +
        "loyers ; confiance aux promoteurs.",
      poids: {
        marche: 2,
        intervention_etat: -2,
        egalite: -1,
      },
    },
  }),
  spectreQuatre({
    id: "sante",
    question:
      "Comment financer et organiser le système de santé ?",
    contexte:
      "Assurance maladie, dépassements d'honoraires, " +
      "hôpitaux publics vs offre privée : le modèle " +
      "mixte français est sous tension.",
    enjeu:
      "On explore solidarité / intervention de l'État " +
      "versus marché et responsabilité individuelle.",
    poleA: {
      id: "sante_publique",
      label: "Santé presque entièrement publique et gratuite",
      nuance:
        "Renforcer l'hôpital public ; réduire la place du " +
        "privé lucratif.",
      poids: {
        solidarite: 2,
        egalite: 2,
        intervention_etat: 2,
        marche: -2,
      },
    },
    midA: {
      label: "Socle public solide, privé complémentaire régulé",
      nuance:
        "Garantir l'accès pour tous, autoriser le privé sous " +
        "contrôles.",
    },
    midB: {
      label: "Plus de choix et de concurrence, avec filet universel",
      nuance:
        "Laisser davantage de place aux assurances et au " +
        "privé, sans laisser personne sans soins.",
    },
    poleB: {
      id: "sante_marche",
      label: "Orientation marché : assurance et offre privée",
      nuance:
        "Responsabiliser les patients ; réduire le rôle de " +
        "l'État financeur unique.",
      poids: {
        marche: 2,
        responsabilite: 2,
        solidarite: -1,
        intervention_etat: -2,
      },
    },
  }),
  spectreQuatre({
    id: "europe",
    question:
      "Quel degré d'intégration européenne souhaitez-vous ?",
    contexte:
      "Budget commun, dette partagée, défense, normes : " +
      "l'UE peut se renforcer ou rester une coopération " +
      "d'États souverains.",
    enjeu:
      "On relie souveraineté (souvent liée à " +
      "décentralisation / autorité nationale) et " +
      "coopération.",
    poleA: {
      id: "federal",
      label: "Plus d'Europe politique et budgétaire",
      nuance:
        "Transférer davantage de pouvoirs à l'UE pour " +
        "agir à l'échelle continentale.",
      poids: {
        intervention_etat: 1,
        egalite: 1,
        decentralisation: -1,
        liberte: 0,
      },
    },
    midA: {
      label: "Europe plus intégrée sur quelques priorités",
      nuance:
        "Climat, défense, industrie : avancer ensemble sans " +
        "tout fédéraliser.",
    },
    midB: {
      label: "Europe des nations : coopération, peu de transferts",
      nuance:
        "Marché commun et accords, mais veto national sur " +
        "l'essentiel.",
    },
    poleB: {
      id: "souverainete",
      label: "Reprendre des compétences nationales",
      nuance:
        "Limiter le droit européen ; prioriser la " +
        "souveraineté de l'État.",
      poids: {
        autorite: 1,
        decentralisation: 1,
        marche: -1,
        intervention_etat: 0,
      },
    },
  }),
  spectreQuatre({
    id: "education",
    question:
      "Quelle priorité pour l'école ?",
    contexte:
      "Égalité des chances, excellence, carte scolaire, " +
      "autonomie des établissements : les modèles scolaires " +
      "traduisent des valeurs différentes.",
    enjeu:
      "On oppose égalité / solidarité et mérite / " +
      "responsabilité / liberté de choix.",
    poleA: {
      id: "ecole_egale",
      label: "Égaliser fortement les parcours et les moyens",
      nuance:
        "Mixité contrainte, mêmes programmes, compensation " +
        "massive des inégalités territoriales.",
      poids: {
        egalite: 2,
        solidarite: 2,
        responsabilite: -1,
        liberte: -1,
      },
    },
    midA: {
      label: "Égalité des chances + accompagnement renforcé",
      nuance:
        "Soutenir les élèves en difficulté sans supprimer " +
        "toute différenciation.",
    },
    midB: {
      label: "Valoriser l'excellence et l'autonomie des établissements",
      nuance:
        "Plus de liberté pédagogique et de parcours " +
        "différenciés.",
    },
    poleB: {
      id: "ecole_merit",
      label: "Sélection et mérite dès que possible",
      nuance:
        "Orientation précoce, compétition, responsabilité " +
        "des familles et des élèves.",
      poids: {
        responsabilite: 2,
        liberte: 1,
        egalite: -2,
        marche: 1,
      },
    },
  }),
  spectreQuatre({
    id: "travail",
    question:
      "Comment organiser le droit du travail ?",
    contexte:
      "Durée du travail, licenciements, dialogue social, " +
      "ubérisation : protéger l'emploi peut freiner " +
      "l'embauche ; flexibiliser peut précariser.",
    enjeu:
      "On situe le curseur entre protection / solidarité " +
      "et flexibilité / marché.",
    poleA: {
      id: "protection",
      label: "Protéger fortement le salariat",
      nuance:
        "Durcir les règles de licenciement ; limiter les " +
        "contrats précaires.",
      poids: {
        solidarite: 2,
        egalite: 1,
        marche: -2,
        intervention_etat: 2,
      },
    },
    midA: {
      label: "Protection élevée, avec assouplissements ciblés",
      nuance:
        "Garder un CDI protecteur, faciliter certains " +
        "ajustements dans les PME.",
    },
    midB: {
      label: "Flexibilité pour l'emploi, avec filet de sécurité",
      nuance:
        "Faciliter embauches et ruptures, compenser par " +
        "assurance chômage et formation.",
    },
    poleB: {
      id: "flexibilite",
      label: "Flexibilité maximale du marché du travail",
      nuance:
        "Contrats libres, peu de contraintes ; " +
        "responsabiliser salarié et employeur.",
      poids: {
        marche: 2,
        responsabilite: 2,
        solidarite: -1,
        intervention_etat: -2,
      },
    },
  }),
];

export type ProfilBoussole = Record<AxeBoussole, number>;

/** Agrège les choix en profil normalisé (−1 … +1). */
export function computeProfil(
  reponses: Record<string, string>,
): ProfilBoussole {
  const scores: Record<AxeBoussole, number> = {
    liberte: 0,
    egalite: 0,
    solidarite: 0,
    responsabilite: 0,
    autorite: 0,
    vie_privee: 0,
    ecologie: 0,
    intervention_etat: 0,
    marche: 0,
    decentralisation: 0,
  };
  const counts: Record<AxeBoussole, number> = { ...scores };

  for (const dilemme of DILEMMES) {
    const choixId = reponses[dilemme.id];
    if (!choixId) continue;
    const choix = dilemme.choix.find((c) => c.id === choixId);
    if (!choix) continue;
    for (const [axe, poids] of Object.entries(choix.poids)) {
      const a = axe as AxeBoussole;
      scores[a] += poids ?? 0;
      counts[a] += 1;
    }
  }

  const profil = {} as ProfilBoussole;
  for (const axe of AXES_BOUSSOLE) {
    if (counts[axe] === 0) {
      profil[axe] = 0;
    } else {
      profil[axe] = Math.max(
        -1,
        Math.min(1, scores[axe] / (counts[axe] * 2)),
      );
    }
  }
  return profil;
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
