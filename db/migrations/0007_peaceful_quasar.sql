CREATE TABLE "sondages_scrutins" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sondages_scrutins_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"scrutin_uid" text NOT NULL,
	"clerk_user_id" text NOT NULL,
	"position" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sondages_scrutins" ADD CONSTRAINT "sondages_scrutins_scrutin_uid_scrutins_uid_fk" FOREIGN KEY ("scrutin_uid") REFERENCES "public"."scrutins"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sondages_scrutin_user_idx" ON "sondages_scrutins" USING btree ("scrutin_uid","clerk_user_id");--> statement-breakpoint
CREATE INDEX "sondages_scrutin_uid_idx" ON "sondages_scrutins" USING btree ("scrutin_uid");