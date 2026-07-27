/**
 * Génère des résumés IA pour les dossiers sans résumé.
 * Provider configurable via AI_PROVIDER (mistral | openai).
 *
 * Usage : pnpm resumes:generate [--limit=20]
 */
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { documents, dossiers, resumesIa } from "../../db/schema";
import { listDossiersSansResume } from "../../lib/queries";
import { urlDocumentAn, urlDossierAn } from "../../lib/urls";

const PROMPT_VERSION = "v1-vulgarisation-neutre";

const SYSTEM = `Tu es un assistant d'éducation civique pour Phronesis.
Tu vulgarises des dossiers législatifs français pour un citoyen lambda.
Règles strictes :
- Neutre : aucun jugement moral, aucun conseil de vote, aucun biais partisan.
- Factuel : base-toi uniquement sur le titre et les documents fournis.
- Clair : français simple, phrases courtes, 120 à 180 mots.
- Structure : 1) de quoi il s'agit, 2) ce que le texte vise, 3) où en est la procédure si connu.
- Si l'information manque, dis-le explicitement.
- N'invente jamais d'articles de loi ni de chiffres.`;

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
      model: createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(modelId),
      modelId,
    };
  }

  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY manquant");
  }
  return {
    model: createMistral({ apiKey: process.env.MISTRAL_API_KEY })(modelId),
    modelId,
  };
}

function parseLimit(): number {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  if (!arg) return 10;
  const n = parseInt(arg.split("=")[1] ?? "10", 10);
  return Number.isNaN(n) ? 10 : Math.max(1, Math.min(n, 100));
}

async function main(): Promise<void> {
  const limit = parseLimit();
  const { model, modelId } = getModel();

  const sansResume = await listDossiersSansResume(limit);
  console.log(
    `${sansResume.length} dossier(s) sans résumé (limit=${limit})`,
  );

  for (const item of sansResume) {
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

    const docsBlock = docs
      .map((d) => `- [${d.typeCode ?? "?"}] ${d.titre}`)
      .join("\n");

    const prompt =
      `Dossier législatif :\n` +
      `Titre : ${dossier.titre}\n` +
      `Procédure : ${dossier.procedureLibelle ?? "non précisée"}\n` +
      `Documents associés :\n${docsBlock || "(aucun)"}\n\n` +
      `Rédige la vulgarisation.`;

    console.log(`→ ${dossier.uid} — ${dossier.titre.slice(0, 80)}`);

    const { text } = await generateText({
      model,
      system: SYSTEM,
      prompt,
      temperature: 0.3,
    });

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
    for (const d of docs.slice(0, 5)) {
      sources.push({
        label: d.titre.slice(0, 120),
        url: urlDocumentAn(d.uid),
      });
    }

    await db
      .insert(resumesIa)
      .values({
        sujetType: "dossier",
        sujetUid: dossier.uid,
        contenu: text.trim(),
        modele: modelId,
        promptVersion: PROMPT_VERSION,
        sources,
      })
      .onConflictDoUpdate({
        target: [resumesIa.sujetType, resumesIa.sujetUid],
        set: {
          contenu: text.trim(),
          modele: modelId,
          promptVersion: PROMPT_VERSION,
          sources,
          genereLe: new Date(),
        },
      });
  }

  console.log("Génération terminée.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
