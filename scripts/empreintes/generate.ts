/**
 * Génère des empreintes civiques qualitatives (batch).
 * Provider configurable via AI_PROVIDER (mistral | openai).
 *
 * Usage : pnpm empreintes:generate [--limit=10]
 */
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import {
  amendements,
  documents,
  dossiers,
  empreintes,
} from "../../db/schema";
import {
  AXES_EMPREINTE,
  isAxeEmpreinte,
  isImpactEmpreinte,
  type AxeEmpreinte,
  type ImpactEmpreinte,
} from "../../lib/empreinte";
import { listDossiersSansEmpreinte } from "../../lib/queries";
import { urlDocumentAn, urlDossierAn } from "../../lib/urls";

const PROMPT_VERSION = "v1-empreinte-qualitative";

type AxeResult = {
  axe: AxeEmpreinte;
  impact: ImpactEmpreinte;
  justification: string;
};

const SYSTEM = `Tu analyses des dossiers législatifs français pour Phronesis.
Tu produis une empreinte civique QUALITATIVE — jamais de note numérique,
jamais de jugement moral (bon/mauvais), jamais de conseil de vote.

Pour chaque axe, choisis un seul impact parmi :
renforce | restreint | mitige | non_aborde | indetermine

Axes (identifiants exacts) :
${AXES_EMPREINTE.join(", ")}

Règles :
- Base-toi uniquement sur le titre et les documents/exposés fournis.
- Si l'axe n'est pas traité : non_aborde.
- Si les sources sont insuffisantes pour trancher : indetermine.
- Justification : 1 à 3 phrases factuelles, sans adjectifs partisans.
- Réponds UNIQUEMENT avec un JSON valide : un tableau de 10 objets
  { "axe": "...", "impact": "...", "justification": "..." }
  un objet par axe, dans l'ordre donné.`;

function getModel(): {
  model: ReturnType<ReturnType<typeof createMistral>>;
  modelId: string;
} {
  const provider = (process.env.AI_PROVIDER ?? "mistral").toLowerCase();
  const modelId =
    process.env.AI_MODEL ??
    (provider === "openai" ? "gpt-4o-mini" : "mistral-small-latest");

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY manquant");
    }
    return {
      model: createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(
        modelId,
      ),
      modelId,
    };
  }

  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY manquant");
  }
  return {
    model: createMistral({ apiKey: process.env.MISTRAL_API_KEY })(
      modelId,
    ),
    modelId,
  };
}

function parseLimit(): number {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  if (!arg) return 5;
  const n = parseInt(arg.split("=")[1] ?? "5", 10);
  return Number.isNaN(n) ? 5 : Math.max(1, Math.min(n, 50));
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence?.[1]?.trim() ?? trimmed;
  return JSON.parse(raw) as unknown;
}

function parseAxes(payload: unknown): AxeResult[] {
  if (!Array.isArray(payload)) {
    throw new Error("Réponse IA : tableau attendu");
  }
  const byAxe = new Map<AxeEmpreinte, AxeResult>();
  for (const item of payload) {
    if (typeof item !== "object" || item == null) continue;
    const rec = item as Record<string, unknown>;
    const axe = String(rec.axe ?? "");
    const impact = String(rec.impact ?? "");
    const justification = String(rec.justification ?? "").trim();
    if (!isAxeEmpreinte(axe) || !isImpactEmpreinte(impact)) continue;
    if (!justification) continue;
    byAxe.set(axe, { axe, impact, justification });
  }
  const missing = AXES_EMPREINTE.filter((a) => !byAxe.has(a));
  if (missing.length > 0) {
    throw new Error(`Axes manquants : ${missing.join(", ")}`);
  }
  return AXES_EMPREINTE.map((a) => byAxe.get(a)!);
}

async function main(): Promise<void> {
  const limit = parseLimit();
  const { model, modelId } = getModel();
  const sans = await listDossiersSansEmpreinte(limit);
  console.log(
    `${sans.length} dossier(s) sans empreinte (limit=${limit})`,
  );

  for (const item of sans) {
    const [dossier] = await db
      .select()
      .from(dossiers)
      .where(eq(dossiers.uid, item.uid))
      .limit(1);
    if (!dossier) continue;

    const docs = await db
      .select({
        uid: documents.uid,
        titre: documents.titre,
        typeCode: documents.typeCode,
      })
      .from(documents)
      .where(eq(documents.dossierUid, dossier.uid))
      .limit(12);

    const amd = await db
      .select({
        exposeSommaire: amendements.exposeSommaire,
        numeroLong: amendements.numeroLong,
      })
      .from(amendements)
      .where(eq(amendements.dossierUid, dossier.uid))
      .limit(8);

    const docsBlock = docs
      .map((d) => `- [${d.typeCode ?? "?"}] ${d.titre}`)
      .join("\n");
    const amdBlock = amd
      .filter((a) => a.exposeSommaire)
      .map(
        (a) =>
          `- ${a.numeroLong ?? "amd"} : ${a.exposeSommaire!.slice(0, 280)}`,
      )
      .join("\n");

    const prompt =
      `Dossier : ${dossier.titre}\n` +
      `Procédure : ${dossier.procedureLibelle ?? "non précisée"}\n` +
      `Documents :\n${docsBlock || "(aucun)"}\n` +
      `Exposés d'amendements (échantillon) :\n${amdBlock || "(aucun)"}\n\n` +
      `Produis le JSON des 10 axes.`;

    console.log(`→ ${dossier.uid} — ${dossier.titre.slice(0, 70)}`);

    const { text } = await generateText({
      model,
      system: SYSTEM,
      prompt,
      temperature: 0.2,
    });

    const axes = parseAxes(extractJson(text));

    const sources: { label: string; url: string }[] = [];
    const official = urlDossierAn(
      dossier.legislature,
      dossier.titreChemin,
    );
    if (official) {
      sources.push({
        label: "Dossier Assemblée nationale",
        url: official,
      });
    }
    for (const d of docs.slice(0, 4)) {
      sources.push({
        label: d.titre.slice(0, 120),
        url: urlDocumentAn(d.uid),
      });
    }

    for (const axe of axes) {
      await db
        .insert(empreintes)
        .values({
          dossierUid: dossier.uid,
          axe: axe.axe,
          impact: axe.impact,
          justification: axe.justification,
          sources,
          modele: modelId,
          promptVersion: PROMPT_VERSION,
        })
        .onConflictDoUpdate({
          target: [empreintes.dossierUid, empreintes.axe],
          set: {
            impact: axe.impact,
            justification: axe.justification,
            sources,
            modele: modelId,
            promptVersion: PROMPT_VERSION,
            genereLe: new Date(),
          },
        });
    }
  }

  console.log("Génération des empreintes terminée.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
