import { desc, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { cachedQuery } from "@/lib/cache";

const { actes, dossiers, scrutins } = schema;

/**
 * Lectures dédiées aux sitemaps : uniquement l'identifiant et une date
 * de dernière modification fiable (dernier acte de procédure, date du
 * scrutin), jamais la date d'import qui bouge à chaque ingestion.
 */
async function listDossiersSitemapUncached(): Promise<
  { uid: string; lastmod: string | null }[]
> {
  const rows = await db
    .select({
      uid: dossiers.uid,
      lastmod: sql<string | null>`max(${actes.date})::text`,
    })
    .from(dossiers)
    .leftJoin(actes, sql`${actes.dossierUid} = ${dossiers.uid}`)
    .groupBy(dossiers.uid)
    .orderBy(desc(sql`max(${actes.date})`));
  return rows;
}

async function listScrutinsSitemapUncached(): Promise<
  { uid: string; lastmod: string }[]
> {
  return db
    .select({
      uid: scrutins.uid,
      lastmod: sql<string>`${scrutins.dateScrutin}::text`,
    })
    .from(scrutins)
    .orderBy(desc(scrutins.dateScrutin));
}

export const listDossiersSitemap = cachedQuery(
  "listDossiersSitemap",
  listDossiersSitemapUncached,
);
export const listScrutinsSitemap = cachedQuery(
  "listScrutinsSitemap",
  listScrutinsSitemapUncached,
);
