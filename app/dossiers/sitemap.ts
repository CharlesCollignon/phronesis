import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { listDossiersSitemap } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await listDossiersSitemap();
  return rows.map((d) => ({
    url: absoluteUrl(`/dossiers/${d.uid}`),
    ...(d.lastmod ? { lastModified: d.lastmod } : {}),
  }));
}
