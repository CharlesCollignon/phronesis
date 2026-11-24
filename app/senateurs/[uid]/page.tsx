import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EluFiche } from "@/components/elu-fiche";
import { JsonLd } from "@/components/json-ld";
import {
  getActeurTransparence,
  getDeputeStats,
  getDeputeVotes,
  getSenateur,
  listGroupesEffectifs,
} from "@/lib/queries";
import { jsonLdElu, metadataElu } from "@/lib/seo-elus";
import { urlPhotoSenateur, urlSenateurSenat } from "@/lib/urls";

/**
 * Page statique : générée à la première visite, puis servie depuis le
 * cache jusqu'à l'invalidation de ses lectures (lib/cache.ts). La rendre
 * à chaque requête coûtait une fonction par passage de robot. La liste
 * vide dit de ne rien générer au build.
 */
export function generateStaticParams(): { uid: string }[] {
  return [];
}

type PageProps = {
  params: Promise<{ uid: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { uid } = await params;
  const data = await getSenateur(uid);
  if (!data) return { title: "Sénateur introuvable", robots: { index: false } };
  return metadataElu({
    chambre: "SENAT",
    acteur: data.acteur,
    mandat: data.mandat,
    groupe: data.groupe,
    photo: null,
    ficheOfficielle: null,
  });
}

export default async function SenateurPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const data = await getSenateur(uid);
  if (!data) notFound();

  const { acteur, mandat, groupe } = data;
  const [stats, historique, transparence, groupesSen] =
    await Promise.all([
      getDeputeStats(uid),
      getDeputeVotes(uid, 40),
      getActeurTransparence(uid),
      listGroupesEffectifs("SENAT"),
    ]);
  const ficheOfficielle = urlSenateurSenat(acteur.senatMatricule);

  const jsonLd = jsonLdElu({
    chambre: "SENAT",
    acteur,
    mandat,
    groupe,
    photo: urlPhotoSenateur(acteur.senatMatricule, acteur.prenom, acteur.nom),
    ficheOfficielle: ficheOfficielle,
    hatvpUrl: transparence.hatvp?.hatvpUrl ?? null,
  });

  return (
    <>
    <JsonLd data={jsonLd} />
    <EluFiche
      chambre="SENAT"
      photo={urlPhotoSenateur(
        acteur.senatMatricule,
        acteur.prenom,
        acteur.nom,
      )}
      acteur={acteur}
      mandat={mandat}
      groupe={groupe}
      stats={stats}
      historique={historique}
      transparence={transparence}
      groupes={groupesSen}
      ficheOfficielle={
        ficheOfficielle
          ? { href: ficheOfficielle, label: "Fiche Sénat" }
          : null
      }
    />
    </>
  );
}
