import { OG_CONTENT_TYPE, OG_SIZE, carteOg } from "@/lib/og";

export const alt =
  "Phronesis — lois, votes et élus du Parlement expliqués sans parti pris";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image(): Promise<Response> {
  return carteOg({
    eyebrow: "Assemblée nationale · Sénat",
    title: "Lois, votes et élus : les données du Parlement expliquées sans parti pris",
  });
}
