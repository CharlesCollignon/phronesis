import { capitalizeTitre } from "@/lib/format";
import { OG_CONTENT_TYPE, OG_SIZE, carteOg } from "@/lib/og";
import { getDossier } from "@/lib/queries";

export const alt = "Dossier législatif expliqué sur Phronesis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ uid: string }>;
}): Promise<Response> {
  const { uid } = await params;
  const data = await getDossier(uid);
  if (!data) return carteOg({ title: "Dossier législatif" });
  const { dossier, scrutins, amendementsCount } = data;
  const chiffres = [
    scrutins.length
      ? `${scrutins.length} scrutin${scrutins.length > 1 ? "s" : ""}`
      : null,
    amendementsCount
      ? `${amendementsCount} amendement${amendementsCount > 1 ? "s" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return carteOg({
    eyebrow: capitalizeTitre(dossier.procedureLibelle) || "Dossier législatif",
    title: capitalizeTitre(dossier.titre),
    footer: chiffres || `${dossier.legislature}e législature`,
  });
}
