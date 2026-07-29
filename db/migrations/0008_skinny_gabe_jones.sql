CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"clerk_user_id" text NOT NULL,
	"type" text NOT NULL,
	"titre" text NOT NULL,
	"body" text NOT NULL,
	"href" text NOT NULL,
	"target_uid" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "empreintes_dossier_idx";--> statement-breakpoint
DROP INDEX "sondages_dossier_uid_idx";--> statement-breakpoint
DROP INDEX "sondages_scrutin_uid_idx";--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "engagement" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("clerk_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_type_target_idx" ON "notifications" USING btree ("clerk_user_id","type","target_uid");