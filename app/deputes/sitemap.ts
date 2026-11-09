import type { MetadataRoute } from "next";

import { listDeputes } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await listDeputes();
  return rows.map((d) => ({ url: absoluteUrl(`/deputes/${d.uid}`) }));
}
