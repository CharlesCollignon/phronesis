import type { MetadataRoute } from "next";

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
  };
}
