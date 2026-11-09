import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EluFiche } from "@/components/elu-fiche";
import { JsonLd } from "@/components/json-ld";
import {
  getActeurTransparence,
  getDepute,
  getDeputeStats,
  getDeputeVotes,
  listGroupesEffectifs,
} from "@/lib/queries";
import { jsonLdElu, metadataElu } from "@/lib/seo-elus";
import {
  listIndicateursDeputes,
  mesuresDepute,
} from "@/lib/travail-parlementaire";
import { urlDeputeAn, urlPhotoDepute } from "@/lib/urls";
import { getVotesParThemeDepute } from "@/lib/votes-par-theme";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uid: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { uid } = await params;
  const data = await getDepute(uid);
  if (!data) return { title: "Député introuvable", robots: { index: false } };
  return metadataElu({
    chambre: "AN",
    acteur: data.acteur,
    mandat: data.mandat,
    groupe: data.groupe,
    photo: null,
    ficheOfficielle: null,
  });
}

export default async function DeputePage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const data = await getDepute(uid);
  if (!data) notFound();

  const { acteur, mandat, groupe } = data;
  const [
    stats,
    historique,
    transparence,
    groupesAn,
    indicateurs,
    votesParTheme,
  ] = await Promise.all([
    getDeputeStats(uid),
    getDeputeVotes(uid, 40),
    getActeurTransparence(uid),
    listGroupesEffectifs("AN"),
    listIndicateursDeputes(),
    getVotesParThemeDepute(uid),
  ]);
  const brut = indicateurs.find((d) => d.acteurUid === uid);
  const mesures = mesuresDepute(indicateurs, uid);

  const jsonLd = jsonLdElu({
    chambre: "AN",
    acteur,
    mandat,
    groupe,
    photo: urlPhotoDepute(uid),
    ficheOfficielle: urlDeputeAn(uid),
    hatvpUrl: transparence.hatvp?.hatvpUrl ?? null,
  });

  return (
    <>
    <JsonLd data={jsonLd} />
    <EluFiche
      chambre="AN"
      photo={urlPhotoDepute(uid)}
      acteur={acteur}
      mandat={mandat}
      groupe={groupe}
      stats={stats}
      historique={historique}
      transparence={transparence}
      groupes={groupesAn}
      travail={brut && mesures ? { mesures, brut } : null}
      votesParTheme={votesParTheme}
      ficheOfficielle={{
        href: urlDeputeAn(uid),
        label: "Fiche Assemblée nationale",
      }}
    />
    </>
  );
}
