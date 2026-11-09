import type { MetadataRoute } from "next";

import { listSenateurs } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await listSenateurs();
  return rows.map((d) => ({ url: absoluteUrl(`/senateurs/${d.uid}`) }));
}
