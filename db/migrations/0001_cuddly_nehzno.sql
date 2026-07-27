ALTER TABLE "actes" ADD COLUMN "statut" text;--> statement-breakpoint
ALTER TABLE "actes" ADD COLUMN "vote_refs" jsonb;--> statement-breakpoint
ALTER TABLE "dossiers" ADD COLUMN "type_dossier" text;--> statement-breakpoint
ALTER TABLE "dossiers" ADD COLUMN "initiateur_acteur_uid" text;