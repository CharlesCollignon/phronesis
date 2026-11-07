CREATE TABLE "amendements_classements" (
	"amendement_uid" text PRIMARY KEY NOT NULL,
	"nature" text NOT NULL,
	"themes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resume" text NOT NULL,
	"orientations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gagnants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"perdants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confiance" text NOT NULL,
	"modele" text NOT NULL,
	"prompt_version" text NOT NULL,
	"genere_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "amendements_classements" ADD CONSTRAINT "amendements_classements_amendement_uid_amendements_uid_fk" FOREIGN KEY ("amendement_uid") REFERENCES "public"."amendements"("uid") ON DELETE cascade ON UPDATE no action;