import { EluListe } from "@/components/elu-liste";
import {
  listDeputes,
  listGroupesEffectifs,
  listSenateurs,
} from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Sénateurs : liste, groupes et votes",
  description:
    "Tous les sénateurs en exercice, par groupe politique et département, avec leurs votes aux scrutins publics du Sénat.",
  path: "/senateurs",
});

type PageProps = {
  searchParams: Promise<{ q?: string; groupe?: string }>;
};

export default async function SenateursPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { q = "", groupe = "" } = await searchParams;
  const [rows, tous, deputes, groupes] = await Promise.all([
    listSenateurs(q),
    listSenateurs(""),
    listDeputes(""),
    listGroupesEffectifs("SENAT"),
  ]);
  const visibles = groupe
    ? rows.filter((r) => r.groupeUid === groupe)
    : rows;

  return (
    <EluListe
      chambre="SENAT"
      rows={visibles}
      q={q}
      groupe={groupe}
      groupes={[...groupes]
        .sort((a, b) => b.effectif - a.effectif)
        .map((g) => ({
          uid: g.uid,
          label: g.libelleAbrege ?? g.libelle,
        }))}
      totalDeputes={deputes.length}
      totalSenateurs={tous.length}
    />
  );
}
