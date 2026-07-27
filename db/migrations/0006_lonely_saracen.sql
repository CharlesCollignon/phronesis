CREATE TABLE "sondages_dossiers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sondages_dossiers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"dossier_uid" text NOT NULL,
	"clerk_user_id" text NOT NULL,
	"position" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"boussole_reponses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"theme" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sondages_dossiers" ADD CONSTRAINT "sondages_dossiers_dossier_uid_dossiers_uid_fk" FOREIGN KEY ("dossier_uid") REFERENCES "public"."dossiers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sondages_dossier_user_idx" ON "sondages_dossiers" USING btree ("dossier_uid","clerk_user_id");--> statement-breakpoint
CREATE INDEX "sondages_dossier_uid_idx" ON "sondages_dossiers" USING btree ("dossier_uid");