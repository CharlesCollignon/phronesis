import type { Metadata } from "next";

/**
 * Référencement : URL canonique du site, descriptions et données
 * structurées (schema.org).
 *
 * L'URL de production vient de `NEXT_PUBLIC_SITE_URL` si elle est
 * définie, sinon du domaine de production Vercel : le jour où un
 * domaine personnalisé est branché, canonicals, sitemaps et données
 * structurées le suivent sans changement de code.
 */
function resoudreSiteUrl(): string {
  const explicite = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicite) return explicite.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_URL = resoudreSiteUrl();
export const SITE_NAME = "Phronesis";
export const SITE_TAGLINE = "Comprendre avant de juger";
export const SITE_DESCRIPTION =
  "Lois, votes nominatifs, députés et sénateurs : les données " +
  "publiques de l'Assemblée nationale et du Sénat expliquées sans " +
  "parti pris, pour former son propre jugement.";

/** URL absolue d'un chemin du site. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Texte brut d'un contenu Markdown (résumés IA), réduit à `max`
 * caractères sur une frontière de mot : Google coupe les descriptions
 * autour de 155 caractères.
 */
export function descriptionCourte(
  text: string | null | undefined,
  max = 158,
): string {
  if (!text) return "";
  const plain = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+>]\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–-]+$/, "")}…`;
}

/** Titre court pour `<title>` (≈ 60 caractères visibles dans Google). */
export function titreCourt(text: string, max = 70): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  /** Chemin canonique, sans domaine (ex. `/dossiers/DLR5L17N1`). */
  path: string;
  type?: "website" | "article" | "profile";
  /** Image Open Graph absolue ; sinon celle du segment s'applique. */
  image?: string | null;
  noindex?: boolean;
};

/**
 * Métadonnées d'une page : titre, description, URL canonique et
 * aperçu de partage (Open Graph / X) cohérents entre eux.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  image,
  noindex,
}: PageMetadataInput): Metadata {
  // Un `openGraph` de page remplace celui du layout, image comprise :
  // on repart de l'image racine. Une image de segment
  // (`opengraph-image.tsx`) reste prioritaire sur cette valeur.
  const images = [
    image
      ? { url: image }
      : {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
  ];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: SITE_NAME,
      locale: "fr_FR",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Éditeur du site, référencé par les autres nœuds schema.org. */
export const ORGANISATION_ID = `${SITE_URL}/#organisation`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function jsonLdSite(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANISATION_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/icon"),
        description: SITE_DESCRIPTION,
        sameAs: ["https://github.com/CharlesCollignon/phronesis"],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        alternateName: `${SITE_NAME} — ${SITE_TAGLINE}`,
        url: SITE_URL,
        inLanguage: "fr-FR",
        description: SITE_DESCRIPTION,
        publisher: { "@id": ORGANISATION_ID },
      },
    ],
  };
}

export const ASSEMBLEE_NATIONALE = {
  "@type": "GovernmentOrganization",
  name: "Assemblée nationale",
  url: "https://www.assemblee-nationale.fr/",
  sameAs: "https://fr.wikipedia.org/wiki/Assembl%C3%A9e_nationale_(France)",
} as const;

export const SENAT = {
  "@type": "GovernmentOrganization",
  name: "Sénat",
  url: "https://www.senat.fr/",
  sameAs: "https://fr.wikipedia.org/wiki/S%C3%A9nat_(France)",
} as const;
