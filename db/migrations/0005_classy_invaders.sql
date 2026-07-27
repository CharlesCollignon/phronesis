CREATE TABLE "acteur_hatvp" (
	"acteur_uid" text PRIMARY KEY NOT NULL,
	"hatvp_url" text NOT NULL,
	"qualite" text NOT NULL,
	"matched_on" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faits_judiciaires_publics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "faits_judiciaires_publics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"acteur_uid" text NOT NULL,
	"date_decision" date,
	"juridiction" text,
	"resume" text NOT NULL,
	"source_url" text NOT NULL,
	"source_label" text NOT NULL,
	"definitive" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acteur_hatvp" ADD CONSTRAINT "acteur_hatvp_acteur_uid_acteurs_uid_fk" FOREIGN KEY ("acteur_uid") REFERENCES "public"."acteurs"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faits_judiciaires_publics" ADD CONSTRAINT "faits_judiciaires_publics_acteur_uid_acteurs_uid_fk" FOREIGN KEY ("acteur_uid") REFERENCES "public"."acteurs"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faits_judiciaires_acteur_idx" ON "faits_judiciaires_publics" USING btree ("acteur_uid");