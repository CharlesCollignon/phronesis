ALTER TABLE "scrutins" ADD COLUMN "amendement_uid" text;--> statement-breakpoint
CREATE INDEX "scrutins_amendement_idx" ON "scrutins" USING btree ("amendement_uid");