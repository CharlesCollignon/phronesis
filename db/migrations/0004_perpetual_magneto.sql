DROP INDEX "scrutins_leg_num_idx";--> statement-breakpoint
ALTER TABLE "acteurs" ADD COLUMN "senat_matricule" text;--> statement-breakpoint
ALTER TABLE "scrutins" ADD COLUMN "chambre" text DEFAULT 'AN' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "acteurs_senat_matricule_idx" ON "acteurs" USING btree ("senat_matricule");--> statement-breakpoint
CREATE INDEX "scrutins_chambre_idx" ON "scrutins" USING btree ("chambre");--> statement-breakpoint
CREATE UNIQUE INDEX "scrutins_chambre_leg_num_idx" ON "scrutins" USING btree ("chambre","legislature","numero");