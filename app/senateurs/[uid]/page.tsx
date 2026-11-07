import { notFound } from "next/navigation";

import { EluFiche } from "@/components/elu-fiche";
import { nomComplet } from "@/lib/format";
import {
  getActeurTransparence,
  getDeputeStats,
  getDeputeVotes,
  getSenateur,
  listGroupesEffectifs,
} from "@/lib/queries";
import { urlPhotoSenateur, urlSenateurSenat } from "@/lib/urls";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uid: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<{ title: string }> {
  const { uid } = await params;
  const data = await getSenateur(uid);
  return {
    title: data
      ? `${nomComplet(data.acteur.prenom, data.acteur.nom)} — Sénateur`
      : "Sénateur",
  };
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

  return (
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
  );
}
