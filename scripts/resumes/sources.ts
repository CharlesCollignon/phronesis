/**
 * Textes officiels lus pour rédiger le résumé d'un dossier : le
 * dispositif (dernier texte adopté, à défaut le texte déposé), l'exposé
 * des motifs du texte initial et, pour un projet de loi, l'avis du
 * Conseil d'État. Réutilise le téléchargement (et le cache disque) des
 * empreintes.
 */
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { documents } from "../../db/schema";
import {
  couper,
  numeroTexteAdopte,
  texteHtml,
  textePdf,
  type SourceDocument,
} from "../empreintes/sources";

const AN = "https://www.assemblee-nationale.fr";

/**
 * Budget en caractères (~3,5 par token) : ~8 000 tokens par dossier,
 * pour rester sous le quota de tokens par minute de l'offre Mistral et
 * garder un coût raisonnable sur ~2 500 dossiers.
 */
const MAX_CARACTERES = Number(process.env.RESUME_MAX_CARACTERES) || 28_000;
const BUDGET = {
  dispositif: Math.round(MAX_CARACTERES * 0.55),
  exposeMotifs: Math.round(MAX_CARACTERES * 0.3),
  avisConseilEtat: Math.round(MAX_CARACTERES * 0.15),
} as const;

/** Textes de l'Assemblée : projets, propositions de loi et de résolution. */
export const TEXTE_AN = /^(PRJL|PION|PNRE)ANR5L\d+B\d+$/;
const TEXTE_ADOPTE_AN = /^(PRJL|PION|PNRE)ANR5L\d+BTA\d+$/;

/** Début du dispositif, après l'exposé des motifs. */
const DEBUT_DISPOSITIF =
  /\n\s*(Article (1er|premier|unique)|Article 1\b|Proposition de résolution\s*\n)/i;

type DocRow = { uid: string; typeCode: string | null; dateDepot: string | null };

/** Sépare l'exposé des motifs du dispositif d'un texte déposé. */
function decouper(texte: string): { expose: string | null; dispositif: string } {
  const debutExpose = texte.search(/EXPOS[ÉE] DES MOTIFS/i);
  if (debutExpose < 0) return { expose: null, dispositif: texte };
  const apres = texte.slice(debutExpose);
  const fin = apres.slice(200).search(DEBUT_DISPOSITIF);
  if (fin < 0) return { expose: apres, dispositif: "" };
  return {
    expose: apres.slice(0, fin + 200),
    dispositif: apres.slice(fin + 200),
  };
}

export async function rassemblerSourcesResume(
  dossierUid: string,
): Promise<SourceDocument[]> {
  const docs: DocRow[] = await db
    .select({
      uid: documents.uid,
      typeCode: documents.typeCode,
      dateDepot: documents.dateDepot,
    })
    .from(documents)
    .where(eq(documents.dossierUid, dossierUid));

  const parDate = (a: DocRow, b: DocRow): number =>
    (a.dateDepot ?? "").localeCompare(b.dateDepot ?? "");
  const sources: SourceDocument[] = [];

  const deposes = docs.filter((d) => TEXTE_AN.test(d.uid)).sort(parDate);
  const initial = deposes[0];
  const adopte = docs
    .filter((d) => TEXTE_ADOPTE_AN.test(d.uid))
    .sort((a, b) => numeroTexteAdopte(a.uid) - numeroTexteAdopte(b.uid))
    .at(-1);

  // Exposé des motifs : ce que les auteurs disent viser.
  const texteInitial = initial ? await texteHtml(initial.uid) : null;
  const decoupe = texteInitial ? decouper(texteInitial) : null;
  if (initial && decoupe?.expose) {
    sources.push({
      label: "Exposé des motifs (texte initial)",
      url: `${AN}/dyn/docs/${initial.uid}.raw`,
      ...couper(decoupe.expose, BUDGET.exposeMotifs),
    });
  }

  // Dispositif : ce que le texte prévoit réellement, dans sa dernière
  // version adoptée par l'Assemblée si elle existe.
  const texteAdopte = adopte ? await texteHtml(adopte.uid) : null;
  if (adopte && texteAdopte) {
    sources.push({
      label: "Texte adopté par l'Assemblée nationale",
      url: `${AN}/dyn/docs/${adopte.uid}.raw`,
      ...couper(texteAdopte, BUDGET.dispositif),
    });
  } else if (initial && decoupe?.dispositif) {
    sources.push({
      label: "Dispositif du texte déposé",
      url: `${AN}/dyn/docs/${initial.uid}.raw`,
      ...couper(decoupe.dispositif, BUDGET.dispositif),
    });
  }

  // Projet de loi : avis du Conseil d'État, regard juridique extérieur.
  const avis = docs
    .filter((d) => d.typeCode === "AVCE" && d.uid.includes("ANR5"))
    .sort(parDate)
    .at(-1);
  if (avis) {
    const t = await textePdf(avis.uid);
    if (t) {
      sources.push({
        label: "Avis du Conseil d'État",
        url: `${AN}/dyn/opendata/${avis.uid}.pdf`,
        ...couper(t, BUDGET.avisConseilEtat),
      });
    }
  }

  return sources;
}
