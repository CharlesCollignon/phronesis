CREATE TABLE "invalidations_cache" (
	"tag" text PRIMARY KEY NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
