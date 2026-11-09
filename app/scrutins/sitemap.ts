import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { listScrutinsSitemap } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await listScrutinsSitemap();
  return rows.map((s) => ({
    url: absoluteUrl(`/scrutins/${s.uid}`),
    lastModified: s.lastmod,
  }));
}
