import type { MetadataRoute } from "next";

import { SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * Les fiches (scrutins, dossiers, parlementaires) restent indexables,
 * ainsi que la pagination (`page`, `chambre`) qui permet de les
 * découvrir. On écarte les URL sans fin : recherche, comparateur et
 * filtres, qui multiplient les variantes d'une même page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/sign-in",
        "/sign-up",
        "/recherche",
        "/comparateur",
        "/*?q=",
        "/*&q=",
        "/*?position=",
        "/*&position=",
        "/*?groupe=",
        "/*&groupe=",
      ],
    },
    host: SITE_URL,
    sitemap: [
      "/sitemap.xml",
      "/dossiers/sitemap.xml",
      "/scrutins/sitemap.xml",
      "/deputes/sitemap.xml",
      "/senateurs/sitemap.xml",
    ].map(absoluteUrl),
  };
}
