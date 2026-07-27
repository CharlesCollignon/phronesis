CREATE TABLE "empreintes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "empreintes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"dossier_uid" text NOT NULL,
	"axe" text NOT NULL,
	"impact" text NOT NULL,
	"justification" text NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"modele" text NOT NULL,
	"prompt_version" text NOT NULL,
	"genere_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "empreintes" ADD CONSTRAINT "empreintes_dossier_uid_dossiers_uid_fk" FOREIGN KEY ("dossier_uid") REFERENCES "public"."dossiers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "empreintes_dossier_axe_idx" ON "empreintes" USING btree ("dossier_uid","axe");--> statement-breakpoint
CREATE INDEX "empreintes_dossier_idx" ON "empreintes" USING btree ("dossier_uid");