/**
 * Rassemble le contenu des documents officiels d'un dossier pour
 * l'empreinte : avis du Conseil d'État, texte adopté, étude d'impact,
 * exposé des motifs. Les fichiers sont mis en cache dans
 * data/cache/an-docs pour ne pas les retélécharger.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";
import { extractText, getDocumentProxy } from "unpdf";

import { db } from "../../db";
import { documents } from "../../db/schema";

const CACHE_DIR = path.join(process.cwd(), "data", "cache", "an-docs");
const USER_AGENT =
  "phronesis-ingest/0.1 (+https://github.com/CharlesCollignon/phronesis)";
const AN = "https://www.assemblee-nationale.fr";

/**
 * Budget total en caractères (~3,5 caractères par token), réparti entre
 * les sources. Par défaut ~15 000 tokens, pour tenir sous la limite de
 * 20 000 tokens par minute de l'offre Mistral actuelle ; à relever via
 * EMPREINTE_MAX_CARACTERES avec une offre plus large.
 */
const MAX_CARACTERES =
  Number(process.env.EMPREINTE_MAX_CARACTERES) || 50_000;
const BUDGET = {
  avisConseilEtat: Math.round(MAX_CARACTERES * 0.36),
  texte: Math.round(MAX_CARACTERES * 0.36),
  etudeImpact: Math.round(MAX_CARACTERES * 0.18),
  exposeMotifs: Math.round(MAX_CARACTERES * 0.1),
} as const;

export type SourceDocument = {
  label: string;
  url: string;
  texte: string;
  /** Le texte a été coupé pour tenir dans le budget. */
  tronque: boolean;
};

type DocRow = { uid: string; typeCode: string | null; dateDepot: string | null };

/** HTML Assemblée (.raw) → texte brut. */
function htmlVersTexte(html: string): string {
  return html
    .replace(/<(script|style|head)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h\d|li|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

async function telecharger(
  url: string,
  fichier: string,
): Promise<Buffer | null> {
  const dest = path.join(CACHE_DIR, fichier);
  if (existsSync(dest)) return readFile(dest);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(dest, buf);
  return buf;
}

/** Texte d'un document AN publié en HTML (textes de loi). */
async function texteHtml(uid: string): Promise<string | null> {
  const buf = await telecharger(`${AN}/dyn/docs/${uid}.raw`, `${uid}.raw`);
  return buf ? htmlVersTexte(buf.toString("utf8")) : null;
}

/** Texte d'un document AN publié en PDF (avis CE, étude d'impact). */
async function textePdf(uid: string): Promise<string | null> {
  const buf = await telecharger(
    `${AN}/dyn/opendata/${uid}.pdf`,
    `${uid}.pdf`,
  );
  if (!buf) return null;
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

function couper(
  texte: string,
  max: number,
): { texte: string; tronque: boolean } {
  if (texte.length <= max) return { texte, tronque: false };
  return { texte: texte.slice(0, max), tronque: true };
}

/** Numéro d'un texte adopté AN (…BTA0337 → 337), pour garder le dernier. */
function numeroTexteAdopte(uid: string): number {
  return parseInt(uid.match(/BTA(\d+)$/)?.[1] ?? "0", 10);
}

const TEXTE_AN = /^(PRJL|PION)ANR5L\d+B\d+$/;
const TEXTE_ADOPTE_AN = /^(PRJL|PION)ANR5L\d+BTA\d+$/;

export async function rassemblerSources(
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

  // 1. Avis du Conseil d'État : analyse indépendante du texte.
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

  // 2. Dernier texte adopté par l'AN, à défaut le dernier texte déposé.
  const adopte = docs
    .filter((d) => TEXTE_ADOPTE_AN.test(d.uid))
    .sort((a, b) => numeroTexteAdopte(a.uid) - numeroTexteAdopte(b.uid))
    .at(-1);
  const deposes = docs.filter((d) => TEXTE_AN.test(d.uid)).sort(parDate);
  const texte = adopte ?? deposes.at(-1);
  if (texte) {
    const t = await texteHtml(texte.uid);
    if (t) {
      sources.push({
        label: adopte
          ? "Texte adopté par l'Assemblée nationale"
          : "Texte déposé à l'Assemblée nationale",
        url: `${AN}/dyn/docs/${texte.uid}.raw`,
        ...couper(t, BUDGET.texte),
      });
    }
  }

  // 3. Début de l'étude d'impact : introduction et tableau des impacts.
  const etude = docs
    .filter((d) => d.typeCode === "ETDI" && d.uid.includes("ANR5"))
    .sort(parDate)
    .at(-1);
  if (etude) {
    const t = await textePdf(etude.uid);
    if (t) {
      sources.push({
        label: "Étude d'impact (début)",
        url: `${AN}/dyn/opendata/${etude.uid}.pdf`,
        ...couper(t, BUDGET.etudeImpact),
      });
    }
  }

  // 4. Exposé des motifs du texte initial : ce que l'auteur dit viser.
  const initial = deposes[0];
  if (initial) {
    const t = await texteHtml(initial.uid);
    const debut = t?.search(/EXPOS[ÉE] DES MOTIFS/i) ?? -1;
    if (t && debut >= 0) {
      sources.push({
        label: "Exposé des motifs (texte initial)",
        url: `${AN}/dyn/docs/${initial.uid}.raw`,
        ...couper(t.slice(debut), BUDGET.exposeMotifs),
      });
    }
  }

  return sources;
}
