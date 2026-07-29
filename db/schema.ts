import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

/**
 * Organes : groupes parlementaires, commissions, assemblée, gouvernement…
 * Source : dumps AMO de data.assemblee-nationale.fr
 */
export const organes = pgTable(
  "organes",
  {
    uid: text("uid").primaryKey(),
    codeType: text("code_type").notNull(),
    libelle: text("libelle").notNull(),
    libelleAbrege: text("libelle_abrege"),
    couleur: text("couleur"),
    positionPolitique: text("position_politique"),
    dateDebut: date("date_debut"),
    dateFin: date("date_fin"),
    legislature: integer("legislature"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("organes_code_type_idx").on(t.codeType)],
);

/** Acteurs : députés, sénateurs et autres acteurs référencés. */
export const acteurs = pgTable(
  "acteurs",
  {
    uid: text("uid").primaryKey(),
    civilite: text("civilite"),
    prenom: text("prenom").notNull(),
    nom: text("nom").notNull(),
    dateNaissance: date("date_naissance"),
    villeNaissance: text("ville_naissance"),
    profession: text("profession"),
    /** Matricule Sénat (ODSEN), pour lier les votes Dosleg. */
    senatMatricule: text("senat_matricule"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): ReturnType<typeof sql> =>
        sql`to_tsvector('french', coalesce(prenom, '') || ' ' || coalesce(nom, ''))`,
    ),
  },
  (t) => [
    index("acteurs_search_idx").using("gin", t.searchVector),
    uniqueIndex("acteurs_senat_matricule_idx").on(t.senatMatricule),
  ],
);

/** Mandats : lien daté acteur <-> organe (groupe, commission, assemblée…). */
export const mandats = pgTable(
  "mandats",
  {
    uid: text("uid").primaryKey(),
    acteurUid: text("acteur_uid")
      .notNull()
      .references(() => acteurs.uid),
    organeUid: text("organe_uid").references(() => organes.uid),
    codeTypeOrgane: text("code_type_organe").notNull(),
    libelleQualite: text("libelle_qualite"),
    dateDebut: date("date_debut"),
    dateFin: date("date_fin"),
    legislature: integer("legislature"),
    circoDepartement: text("circo_departement"),
    circoNumDepartement: text("circo_num_departement"),
    circoNum: text("circo_num"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("mandats_acteur_idx").on(t.acteurUid),
    index("mandats_organe_idx").on(t.organeUid),
    index("mandats_type_idx").on(t.codeTypeOrgane),
  ],
);

/** Dossiers législatifs : projets et propositions de loi. */
export const dossiers = pgTable(
  "dossiers",
  {
    uid: text("uid").primaryKey(),
    legislature: integer("legislature").notNull(),
    titre: text("titre").notNull(),
    titreChemin: text("titre_chemin"),
    procedureCode: text("procedure_code"),
    procedureLibelle: text("procedure_libelle"),
    senatChemin: text("senat_chemin"),
    typeDossier: text("type_dossier"),
    initiateurActeurUid: text("initiateur_acteur_uid"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): ReturnType<typeof sql> =>
        sql`to_tsvector('french', coalesce(titre, ''))`,
    ),
  },
  (t) => [index("dossiers_search_idx").using("gin", t.searchVector)],
);

/** Actes législatifs : étapes de la procédure d'un dossier (aplaties). */
export const actes = pgTable(
  "actes",
  {
    uid: text("uid").primaryKey(),
    dossierUid: text("dossier_uid")
      .notNull()
      .references(() => dossiers.uid, { onDelete: "cascade" }),
    code: text("code").notNull(),
    libelle: text("libelle"),
    date: date("date"),
    ordre: integer("ordre").notNull(),
    profondeur: integer("profondeur").notNull().default(0),
    parentUid: text("parent_uid"),
    organeRef: text("organe_ref"),
    texteAssocieRef: text("texte_associe_ref"),
    statut: text("statut"),
    voteRefs: jsonb("vote_refs").$type<string[]>(),
  },
  (t) => [index("actes_dossier_idx").on(t.dossierUid)],
);

/** Documents : textes déposés, rapports, textes adoptés… */
export const documents = pgTable(
  "documents",
  {
    uid: text("uid").primaryKey(),
    dossierUid: text("dossier_uid").references(() => dossiers.uid),
    classeCode: text("classe_code"),
    typeCode: text("type_code"),
    sousTypeCode: text("sous_type_code"),
    titre: text("titre").notNull(),
    dateDepot: date("date_depot"),
    legislature: integer("legislature"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("documents_dossier_idx").on(t.dossierUid)],
);

/** Scrutins publics (votes nominatifs en séance). */
export const scrutins = pgTable(
  "scrutins",
  {
    uid: text("uid").primaryKey(),
    /** Assemblée nationale (`AN`) ou Sénat (`SENAT`). */
    chambre: text("chambre").notNull().default("AN"),
    numero: integer("numero").notNull(),
    /** AN : législature ; Sénat : année de session (sesann). */
    legislature: integer("legislature").notNull(),
    dateScrutin: date("date_scrutin").notNull(),
    titre: text("titre").notNull(),
    typeVoteCode: text("type_vote_code"),
    typeVoteLibelle: text("type_vote_libelle"),
    sortCode: text("sort_code").notNull(),
    demandeur: text("demandeur"),
    seanceRef: text("seance_ref"),
    dossierUid: text("dossier_uid").references(() => dossiers.uid),
    nombreVotants: integer("nombre_votants"),
    suffragesExprimes: integer("suffrages_exprimes"),
    suffragesRequis: integer("suffrages_requis"),
    pour: integer("pour"),
    contre: integer("contre"),
    abstentions: integer("abstentions"),
    nonVotants: integer("non_votants"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): ReturnType<typeof sql> =>
        sql`to_tsvector('french', coalesce(titre, ''))`,
    ),
  },
  (t) => [
    index("scrutins_date_idx").on(t.dateScrutin),
    index("scrutins_dossier_idx").on(t.dossierUid),
    index("scrutins_chambre_idx").on(t.chambre),
    index("scrutins_search_idx").using("gin", t.searchVector),
    uniqueIndex("scrutins_chambre_leg_num_idx").on(
      t.chambre,
      t.legislature,
      t.numero,
    ),
  ],
);

/** Position nominative d'un député sur un scrutin. */
export const votes = pgTable(
  "votes",
  {
    scrutinUid: text("scrutin_uid")
      .notNull()
      .references(() => scrutins.uid, { onDelete: "cascade" }),
    acteurUid: text("acteur_uid")
      .notNull()
      .references(() => acteurs.uid),
    groupeUid: text("groupe_uid").references(() => organes.uid),
    position: text("position").notNull(),
    parDelegation: boolean("par_delegation").notNull().default(false),
    causePosition: text("cause_position"),
  },
  (t) => [
    primaryKey({ columns: [t.scrutinUid, t.acteurUid] }),
    index("votes_acteur_idx").on(t.acteurUid),
    index("votes_groupe_idx").on(t.groupeUid),
  ],
);

/** Amendements déposés (dispositif, exposé des motifs, sort). */
export const amendements = pgTable(
  "amendements",
  {
    uid: text("uid").primaryKey(),
    numeroLong: text("numero_long"),
    legislature: integer("legislature"),
    texteRef: text("texte_ref"),
    dossierUid: text("dossier_uid").references(() => dossiers.uid),
    auteurType: text("auteur_type"),
    auteurActeurUid: text("auteur_acteur_uid"),
    auteurGroupeUid: text("auteur_groupe_uid"),
    articleDesignation: text("article_designation"),
    dispositif: text("dispositif"),
    exposeSommaire: text("expose_sommaire"),
    sort: text("sort"),
    etat: text("etat"),
    dateDepot: date("date_depot"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("amendements_dossier_idx").on(t.dossierUid),
    index("amendements_texte_idx").on(t.texteRef),
    index("amendements_auteur_idx").on(t.auteurActeurUid),
  ],
);

/**
 * Empreinte civique qualitative (pas de scores numériques).
 * Un impact par axe et par dossier, avec justification et sources.
 */
export const empreintes = pgTable(
  "empreintes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    dossierUid: text("dossier_uid")
      .notNull()
      .references(() => dossiers.uid, { onDelete: "cascade" }),
    axe: text("axe").notNull(),
    impact: text("impact").notNull(),
    justification: text("justification").notNull(),
    sources: jsonb("sources")
      .$type<{ label: string; url: string }[]>()
      .notNull()
      .default([]),
    modele: text("modele").notNull(),
    promptVersion: text("prompt_version").notNull(),
    genereLe: timestamp("genere_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("empreintes_dossier_axe_idx").on(t.dossierUid, t.axe),
  ],
);

/**
 * Résumés IA : séparés des données factuelles.
 * Chaque résumé porte son modèle, sa version de prompt et ses sources.
 */
export const resumesIa = pgTable(
  "resumes_ia",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    sujetType: text("sujet_type").notNull(),
    sujetUid: text("sujet_uid").notNull(),
    contenu: text("contenu").notNull(),
    modele: text("modele").notNull(),
    promptVersion: text("prompt_version").notNull(),
    sources: jsonb("sources")
      .$type<{ label: string; url: string }[]>()
      .notNull()
      .default([]),
    genereLe: timestamp("genere_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("resumes_sujet_idx").on(t.sujetType, t.sujetUid)],
);

/** Journal des imports de données (traçabilité des dumps sources). */
export const imports = pgTable("imports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  dataset: text("dataset").notNull(),
  sourceUrl: text("source_url").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  rowCount: integer("row_count"),
  durationMs: integer("duration_ms"),
});

/**
 * Lien acteur → fiche HATVP (déclarations publiques).
 * Pas de contenu de déclaration — uniquement l'URL officielle.
 */
export const acteurHatvp = pgTable(
  "acteur_hatvp",
  {
    acteurUid: text("acteur_uid")
      .primaryKey()
      .references(() => acteurs.uid, { onDelete: "cascade" }),
    hatvpUrl: text("hatvp_url").notNull(),
    qualite: text("qualite").notNull(),
    matchedOn: text("matched_on").notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

/**
 * Décisions judiciaires publiques définitives (curaté manuellement).
 * Jamais un casier ; jamais de procédure en cours.
 */
export const faitsJudiciairesPublics = pgTable(
  "faits_judiciaires_publics",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    acteurUid: text("acteur_uid")
      .notNull()
      .references(() => acteurs.uid, { onDelete: "cascade" }),
    dateDecision: date("date_decision"),
    juridiction: text("juridiction"),
    resume: text("resume").notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceLabel: text("source_label").notNull(),
    definitive: boolean("definitive").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("faits_judiciaires_acteur_idx").on(t.acteurUid)],
);

export type UserEngagement = {
  lastVisit?: string;
  streakDays?: number;
};

/**
 * Profil utilisateur Clerk : boussole cloud + préférence thème.
 */
export const userProfiles = pgTable("user_profiles", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  boussoleReponses: jsonb("boussole_reponses")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  theme: text("theme"),
  engagement: jsonb("engagement")
    .$type<UserEngagement>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type NotificationType =
  | "nouveau_scrutin"
  | "nouveau_dossier"
  | "resonance_haute";

/**
 * Notifications in-app (Clerk) — pas de push / email.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    clerkUserId: text("clerk_user_id").notNull(),
    type: text("type").$type<NotificationType>().notNull(),
    titre: text("titre").notNull(),
    body: text("body").notNull(),
    href: text("href").notNull(),
    targetUid: text("target_uid").notNull(),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("notifications_user_created_idx").on(
      t.clerkUserId,
      t.createdAt,
    ),
    uniqueIndex("notifications_user_type_target_idx").on(
      t.clerkUserId,
      t.type,
      t.targetUid,
    ),
  ],
);

/**
 * Sondage d'opinion citoyen sur un dossier (pas un scrutin officiel).
 * Un avis par utilisateur et par dossier, modifiable.
 */
export const sondagesDossiers = pgTable(
  "sondages_dossiers",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    dossierUid: text("dossier_uid")
      .notNull()
      .references(() => dossiers.uid, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    position: text("position").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sondages_dossier_user_idx").on(
      t.dossierUid,
      t.clerkUserId,
    ),
  ],
);

/**
 * Sondage d'opinion citoyen sur un scrutin (pas un vote officiel).
 */
export const sondagesScrutins = pgTable(
  "sondages_scrutins",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    scrutinUid: text("scrutin_uid")
      .notNull()
      .references(() => scrutins.uid, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    position: text("position").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sondages_scrutin_user_idx").on(
      t.scrutinUid,
      t.clerkUserId,
    ),
  ],
);
