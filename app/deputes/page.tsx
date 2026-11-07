import { EluListe } from "@/components/elu-liste";
import {
  listDeputes,
  listGroupesEffectifs,
  listSenateurs,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Députés",
};

type PageProps = {
  searchParams: Promise<{ q?: string; groupe?: string }>;
};

export default async function DeputesPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { q = "", groupe = "" } = await searchParams;
  const [rows, tous, senateurs, groupes] = await Promise.all([
    listDeputes(q),
    listDeputes(""),
    listSenateurs(""),
    listGroupesEffectifs("AN"),
  ]);
  const visibles = groupe
    ? rows.filter((r) => r.groupeUid === groupe)
    : rows;

  return (
    <EluListe
      chambre="AN"
      rows={visibles}
      q={q}
      groupe={groupe}
      groupes={[...groupes]
        .sort((a, b) => b.effectif - a.effectif)
        .map((g) => ({
          uid: g.uid,
          label: g.libelleAbrege ?? g.libelle,
        }))}
      totalDeputes={tous.length}
      totalSenateurs={senateurs.length}
    />
  );
}
