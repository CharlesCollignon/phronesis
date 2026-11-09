import type { Metadata } from "next";

import { libelleCirco } from "@/components/elu-liste";
import { nomComplet } from "@/lib/format";
import {
  ASSEMBLEE_NATIONALE,
  SENAT,
  WEBSITE_ID,
  absoluteUrl,
  descriptionCourte,
  pageMetadata,
} from "@/lib/seo";

type EluSeoInput = {
  chambre: "AN" | "SENAT";
  acteur: {
    uid: string;
    prenom: string;
    nom: string;
    civilite: string | null;
    profession?: string | null;
  };
  mandat: {
    circoDepartement: string | null;
    circoNum: string | null;
    dateDebut?: string | null;
  } | null;
  groupe: { libelle: string; libelleAbrege: string | null } | null;
  photo: string | null;
  ficheOfficielle: string | null;
  hatvpUrl?: string | null;
};

function fonctionElu(chambre: "AN" | "SENAT", civilite: string | null): string {
  const f = civilite === "Mme";
  if (chambre === "AN") return f ? "députée" : "député";
  return f ? "sénatrice" : "sénateur";
}

function circoElu({ chambre, mandat }: EluSeoInput): string | null {
  if (!mandat) return null;
  return chambre === "AN"
    ? libelleCirco(mandat.circoDepartement, mandat.circoNum, true)
    : mandat.circoDepartement;
}

/**
 * Titre et description d'une fiche parlementaire, pensés pour les
 * recherches « nom + député » et « député + département ».
 */
export function metadataElu(input: EluSeoInput): Metadata {
  const { chambre, acteur, mandat, groupe } = input;
  const nom = nomComplet(acteur.prenom, acteur.nom);
  const fonction = fonctionElu(chambre, acteur.civilite);
  const lieu = mandat?.circoDepartement;
  const sigle = groupe?.libelleAbrege ?? groupe?.libelle;
  const circo = circoElu(input);

  // « Jeanne Martin, députée — Gironde (EPR) : votes et activité »
  const title =
    `${nom}, ${fonction}` +
    (lieu ? ` — ${lieu}` : "") +
    (sigle ? ` (${sigle})` : "") +
    " : votes et activité";

  const description = descriptionCourte(
    `${nom}, ${fonction}${circo ? ` (${circo})` : ""}` +
      `${groupe ? `, groupe ${groupe.libelle}` : ""}. ` +
      `Tous ses votes aux scrutins publics, sa participation` +
      `${chambre === "AN" ? ", ses amendements" : ""} et ses déclarations ` +
      `d'intérêts, à partir des données officielles.`,
    170,
  );

  return pageMetadata({
    title,
    description,
    path: `/${chambre === "AN" ? "deputes" : "senateurs"}/${acteur.uid}`,
    type: "profile",

  });
}

/** Données structurées schema.org `Person` d'un parlementaire. */
export function jsonLdElu(input: EluSeoInput): Record<string, unknown> {
  const { chambre, acteur, mandat, groupe } = input;
  const url = absoluteUrl(
    `/${chambre === "AN" ? "deputes" : "senateurs"}/${acteur.uid}`,
  );
  const fonction = fonctionElu(chambre, acteur.civilite);
  const sameAs = [input.ficheOfficielle, input.hatvpUrl].filter(
    (v): v is string => Boolean(v),
  );
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": url,
    url,
    inLanguage: "fr-FR",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "Person",
      "@id": `${url}#personne`,
      name: nomComplet(acteur.prenom, acteur.nom),
      givenName: acteur.prenom,
      familyName: acteur.nom,
      jobTitle: fonction.charAt(0).toUpperCase() + fonction.slice(1),
      nationality: { "@type": "Country", name: "France" },
      ...(acteur.civilite === "Mme"
        ? { gender: "https://schema.org/Female" }
        : acteur.civilite === "M."
          ? { gender: "https://schema.org/Male" }
          : {}),
      ...(input.photo ? { image: input.photo } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(acteur.profession ? { hasOccupation: { "@type": "Occupation", name: acteur.profession } } : {}),
      ...(circoElu(input)
        ? { workLocation: { "@type": "AdministrativeArea", name: circoElu(input) } }
        : {}),
      memberOf: [
        {
          "@type": "OrganizationRole",
          roleName: fonction,
          ...(mandat?.dateDebut ? { startDate: mandat.dateDebut } : {}),
          memberOf: chambre === "AN" ? ASSEMBLEE_NATIONALE : SENAT,
        },
        ...(groupe
          ? [
              {
                "@type": "Organization",
                name: groupe.libelle,
                ...(groupe.libelleAbrege
                  ? { alternateName: groupe.libelleAbrege }
                  : {}),
              },
            ]
          : []),
      ],
    },
  };
}
