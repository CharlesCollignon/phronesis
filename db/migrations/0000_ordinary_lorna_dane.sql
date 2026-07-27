CREATE TABLE "actes" (
	"uid" text PRIMARY KEY NOT NULL,
	"dossier_uid" text NOT NULL,
	"code" text NOT NULL,
	"libelle" text,
	"date" date,
	"ordre" integer NOT NULL,
	"profondeur" integer DEFAULT 0 NOT NULL,
	"parent_uid" text,
	"organe_ref" text,
	"texte_associe_ref" text
);
--> statement-breakpoint
CREATE TABLE "acteurs" (
	"uid" text PRIMARY KEY NOT NULL,
	"civilite" text,
	"prenom" text NOT NULL,
	"nom" text NOT NULL,
	"date_naissance" date,
	"ville_naissance" text,
	"profession" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amendements" (
	"uid" text PRIMARY KEY NOT NULL,
	"numero_long" text,
	"legislature" integer,
	"texte_ref" text,
	"dossier_uid" text,
	"auteur_type" text,
	"auteur_acteur_uid" text,
	"auteur_groupe_uid" text,
	"article_designation" text,
	"dispositif" text,
	"expose_sommaire" text,
	"sort" text,
	"etat" text,
	"date_depot" date,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"uid" text PRIMARY KEY NOT NULL,
	"dossier_uid" text,
	"classe_code" text,
	"type_code" text,
	"sous_type_code" text,
	"titre" text NOT NULL,
	"date_depot" date,
	"legislature" integer,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dossiers" (
	"uid" text PRIMARY KEY NOT NULL,
	"legislature" integer NOT NULL,
	"titre" text NOT NULL,
	"titre_chemin" text,
	"procedure_code" text,
	"procedure_libelle" text,
	"senat_chemin" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('french', coalesce(titre, ''))) STORED
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "imports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"dataset" text NOT NULL,
	"source_url" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_count" integer,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "mandats" (
	"uid" text PRIMARY KEY NOT NULL,
	"acteur_uid" text NOT NULL,
	"organe_uid" text,
	"code_type_organe" text NOT NULL,
	"libelle_qualite" text,
	"date_debut" date,
	"date_fin" date,
	"legislature" integer,
	"circo_departement" text,
	"circo_num_departement" text,
	"circo_num" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organes" (
	"uid" text PRIMARY KEY NOT NULL,
	"code_type" text NOT NULL,
	"libelle" text NOT NULL,
	"libelle_abrege" text,
	"couleur" text,
	"position_politique" text,
	"date_debut" date,
	"date_fin" date,
	"legislature" integer,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumes_ia" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resumes_ia_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sujet_type" text NOT NULL,
	"sujet_uid" text NOT NULL,
	"contenu" text NOT NULL,
	"modele" text NOT NULL,
	"prompt_version" text NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"genere_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrutins" (
	"uid" text PRIMARY KEY NOT NULL,
	"numero" integer NOT NULL,
	"legislature" integer NOT NULL,
	"date_scrutin" date NOT NULL,
	"titre" text NOT NULL,
	"type_vote_code" text,
	"type_vote_libelle" text,
	"sort_code" text NOT NULL,
	"demandeur" text,
	"seance_ref" text,
	"dossier_uid" text,
	"nombre_votants" integer,
	"suffrages_exprimes" integer,
	"suffrages_requis" integer,
	"pour" integer,
	"contre" integer,
	"abstentions" integer,
	"non_votants" integer,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('french', coalesce(titre, ''))) STORED
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"scrutin_uid" text NOT NULL,
	"acteur_uid" text NOT NULL,
	"groupe_uid" text,
	"position" text NOT NULL,
	"par_delegation" boolean DEFAULT false NOT NULL,
	"cause_position" text,
	CONSTRAINT "votes_scrutin_uid_acteur_uid_pk" PRIMARY KEY("scrutin_uid","acteur_uid")
);
--> statement-breakpoint
ALTER TABLE "actes" ADD CONSTRAINT "actes_dossier_uid_dossiers_uid_fk" FOREIGN KEY ("dossier_uid") REFERENCES "public"."dossiers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amendements" ADD CONSTRAINT "amendements_dossier_uid_dossiers_uid_fk" FOREIGN KEY ("dossier_uid") REFERENCES "public"."dossiers"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_dossier_uid_dossiers_uid_fk" FOREIGN KEY ("dossier_uid") REFERENCES "public"."dossiers"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandats" ADD CONSTRAINT "mandats_acteur_uid_acteurs_uid_fk" FOREIGN KEY ("acteur_uid") REFERENCES "public"."acteurs"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandats" ADD CONSTRAINT "mandats_organe_uid_organes_uid_fk" FOREIGN KEY ("organe_uid") REFERENCES "public"."organes"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrutins" ADD CONSTRAINT "scrutins_dossier_uid_dossiers_uid_fk" FOREIGN KEY ("dossier_uid") REFERENCES "public"."dossiers"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_scrutin_uid_scrutins_uid_fk" FOREIGN KEY ("scrutin_uid") REFERENCES "public"."scrutins"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_acteur_uid_acteurs_uid_fk" FOREIGN KEY ("acteur_uid") REFERENCES "public"."acteurs"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_groupe_uid_organes_uid_fk" FOREIGN KEY ("groupe_uid") REFERENCES "public"."organes"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actes_dossier_idx" ON "actes" USING btree ("dossier_uid");--> statement-breakpoint
CREATE INDEX "amendements_dossier_idx" ON "amendements" USING btree ("dossier_uid");--> statement-breakpoint
CREATE INDEX "amendements_texte_idx" ON "amendements" USING btree ("texte_ref");--> statement-breakpoint
CREATE INDEX "amendements_auteur_idx" ON "amendements" USING btree ("auteur_acteur_uid");--> statement-breakpoint
CREATE INDEX "documents_dossier_idx" ON "documents" USING btree ("dossier_uid");--> statement-breakpoint
CREATE INDEX "dossiers_search_idx" ON "dossiers" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "mandats_acteur_idx" ON "mandats" USING btree ("acteur_uid");--> statement-breakpoint
CREATE INDEX "mandats_organe_idx" ON "mandats" USING btree ("organe_uid");--> statement-breakpoint
CREATE INDEX "mandats_type_idx" ON "mandats" USING btree ("code_type_organe");--> statement-breakpoint
CREATE INDEX "organes_code_type_idx" ON "organes" USING btree ("code_type");--> statement-breakpoint
CREATE UNIQUE INDEX "resumes_sujet_idx" ON "resumes_ia" USING btree ("sujet_type","sujet_uid");--> statement-breakpoint
CREATE INDEX "scrutins_date_idx" ON "scrutins" USING btree ("date_scrutin");--> statement-breakpoint
CREATE INDEX "scrutins_dossier_idx" ON "scrutins" USING btree ("dossier_uid");--> statement-breakpoint
CREATE INDEX "scrutins_search_idx" ON "scrutins" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "scrutins_leg_num_idx" ON "scrutins" USING btree ("legislature","numero");--> statement-breakpoint
CREATE INDEX "votes_acteur_idx" ON "votes" USING btree ("acteur_uid");--> statement-breakpoint
CREATE INDEX "votes_groupe_idx" ON "votes" USING btree ("groupe_uid");