import {
  capitalizeTitre,
  decoderEntites,
  formatDate,
  formatSort,
} from "@/lib/format";
import { BarreVote, OG_CONTENT_TYPE, OG_SIZE, carteOg } from "@/lib/og";
import { getScrutin } from "@/lib/queries";

export const alt = "Résultat d'un scrutin public sur Phronesis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ uid: string }>;
}): Promise<Response> {
  const { uid } = await params;
  const data = await getScrutin(uid);
  if (!data) return carteOg({ title: "Scrutin public" });
  const { scrutin } = data;
  const senat = scrutin.chambre === "SENAT";
  return carteOg({
    eyebrow: `Scrutin public n° ${scrutin.numero} · ${formatSort(scrutin.sortCode)}`,
    title: capitalizeTitre(decoderEntites(scrutin.titre)),
    footer: `${senat ? "Sénat" : "Assemblée nationale"} · ${formatDate(scrutin.dateScrutin)}`,
    children: (
      <BarreVote
        pour={scrutin.pour ?? 0}
        contre={scrutin.contre ?? 0}
        abstention={scrutin.abstentions ?? 0}
      />
    ),
  });
}
