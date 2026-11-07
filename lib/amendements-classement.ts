/**
 * Référentiel du classement des amendements : thèmes, orientations par
 * thème (deux pôles concrets), catégories qui y gagnent ou y perdent.
 * Partagé par le script de classement et l'affichage.
 */

export const THEMES = [
  "immigration",
  "ecologie_energie",
  "fiscalite_budget",
  "protection_sociale",
  "sante",
  "travail_emploi",
  "securite_justice",
  "libertes_numerique",
  "education_recherche",
  "logement",
  "agriculture",
  "institutions_collectivites",
  "international_defense",
  "culture_medias",
  "autre",
] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  immigration: "Immigration",
  ecologie_energie: "Écologie et énergie",
  fiscalite_budget: "Fiscalité et budget",
  protection_sociale: "Protection sociale",
  sante: "Santé",
  travail_emploi: "Travail et emploi",
  securite_justice: "Sécurité et justice",
  libertes_numerique: "Libertés et numérique",
  education_recherche: "Éducation et recherche",
  logement: "Logement",
  agriculture: "Agriculture",
  institutions_collectivites: "Institutions et collectivités",
  international_defense: "International et défense",
  culture_medias: "Culture et médias",
  autre: "Autre",
};

/** Les deux pôles d'un thème, avec leur libellé. */
export type Poles = readonly [
  { id: string; label: string },
  { id: string; label: string },
];

export const ORIENTATIONS: Partial<Record<Theme, Poles>> = {
  immigration: [
    { id: "plus_ouvert", label: "Plus ouvert" },
    { id: "plus_restrictif", label: "Plus restrictif" },
  ],
  ecologie_energie: [
    { id: "plus_protecteur_environnement", label: "Plus protecteur de l'environnement" },
    { id: "moins_protecteur_environnement", label: "Moins protecteur de l'environnement" },
  ],
  fiscalite_budget: [
    { id: "plus_de_prelevements", label: "Plus de prélèvements" },
    { id: "moins_de_prelevements", label: "Moins de prélèvements" },
  ],
  protection_sociale: [
    { id: "elargit_protection", label: "Élargit la protection" },
    { id: "restreint_protection", label: "Restreint la protection" },
  ],
  sante: [
    { id: "elargit_acces_aux_soins", label: "Élargit l'accès aux soins" },
    { id: "restreint_acces_aux_soins", label: "Restreint l'accès aux soins" },
  ],
  travail_emploi: [
    { id: "plus_protecteur_salaries", label: "Plus protecteur des salariés" },
    { id: "plus_flexible_employeurs", label: "Plus de flexibilité pour les employeurs" },
  ],
  securite_justice: [
    { id: "plus_repressif", label: "Plus répressif" },
    { id: "plus_de_garanties_personnes", label: "Plus de garanties pour les personnes" },
  ],
  libertes_numerique: [
    { id: "plus_de_controle", label: "Plus de contrôle" },
    { id: "plus_de_libertes", label: "Plus de libertés" },
  ],
  logement: [
    { id: "plus_regule", label: "Plus régulé" },
    { id: "moins_regule", label: "Moins régulé" },
  ],
  institutions_collectivites: [
    { id: "plus_decentralise", label: "Plus décentralisé" },
    { id: "plus_centralise", label: "Plus centralisé" },
  ],
};

export const CATEGORIES = [
  "menages_modestes",
  "classes_moyennes",
  "hauts_revenus_patrimoines",
  "grandes_entreprises",
  "pme_independants",
  "salaries",
  "retraites",
  "jeunes_etudiants",
  "agriculteurs",
  "etrangers",
  "collectivites",
  "finances_publiques",
] as const;

export type Categorie = (typeof CATEGORIES)[number];

export const CATEGORIE_LABELS: Record<Categorie, string> = {
  menages_modestes: "Ménages modestes",
  classes_moyennes: "Classes moyennes",
  hauts_revenus_patrimoines: "Hauts revenus et patrimoines",
  grandes_entreprises: "Grandes entreprises",
  pme_independants: "PME et indépendants",
  salaries: "Salariés",
  retraites: "Retraités",
  jeunes_etudiants: "Jeunes et étudiants",
  agriculteurs: "Agriculteurs",
  etrangers: "Étrangers",
  collectivites: "Collectivités",
  finances_publiques: "Finances publiques",
};

export const NATURES = [
  "redactionnel",
  "rapport",
  "suppression",
  "ajout",
  "modification",
] as const;

export const CONFIANCES = ["haute", "moyenne", "basse"] as const;

export function isTheme(v: unknown): v is Theme {
  return (THEMES as readonly unknown[]).includes(v);
}

export function isCategorie(v: unknown): v is Categorie {
  return (CATEGORIES as readonly unknown[]).includes(v);
}
