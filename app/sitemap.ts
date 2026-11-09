import type { MetadataRoute } from "next";

import { PHILOSOPHIES } from "@/lib/philosophies";
import { listGroupesEffectifs } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Pages éditoriales, groupes et conceptions. Les fiches (lois, votes,
 * élus) ont leur propre sitemap par section, déclaré dans robots.txt.
 */
const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/dossiers", priority: 0.9 },
  { path: "/scrutins", priority: 0.9 },
  { path: "/deputes", priority: 0.9 },
  { path: "/senateurs", priority: 0.8 },
  { path: "/groupes", priority: 0.8 },
  { path: "/actualite", priority: 0.8 },
  { path: "/boussole", priority: 0.8 },
  { path: "/philosophies", priority: 0.6 },
  { path: "/methodologie", priority: 0.6 },
  { path: "/mentions-legales", priority: 0.1 },
  { path: "/confidentialite", priority: 0.1 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [groupesAn, groupesSenat] = await Promise.all([
    listGroupesEffectifs("AN"),
    listGroupesEffectifs("SENAT"),
  ]);
  return [
    ...PAGES.map((p) => ({ url: absoluteUrl(p.path), priority: p.priority })),
    ...[...groupesAn, ...groupesSenat].map((g) => ({
      url: absoluteUrl(`/groupes/${g.uid}`),
      priority: 0.7,
    })),
    ...PHILOSOPHIES.map((p) => ({
      url: absoluteUrl(`/philosophies/${p.id}`),
      priority: 0.5,
    })),
  ];
}
