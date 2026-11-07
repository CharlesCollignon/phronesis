/**
 * Accès au modèle d'IA partagé par les scripts batch (empreintes,
 * classement des amendements). Provider configurable via AI_PROVIDER
 * (mistral | openai) et AI_MODEL.
 */
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, generateText } from "ai";

export function getModel(): {
  model: ReturnType<ReturnType<typeof createMistral>>;
  modelId: string;
} {
  const provider = (process.env.AI_PROVIDER ?? "mistral").toLowerCase();
  const modelId =
    process.env.AI_MODEL ??
    (provider === "openai" ? "gpt-4o-mini" : "mistral-large-4");

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

/** Extrait le JSON d'une réponse, avec ou sans bloc ```json. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence?.[1]?.trim() ?? trimmed;
  return JSON.parse(raw) as unknown;
}

/**
 * Appel au modèle qui attend la fin de la fenêtre d'une minute quand
 * le quota de tokens par minute est atteint (offres Mistral limitées).
 */
export async function genererAvecAttente(
  options: Parameters<typeof generateText>[0],
): ReturnType<typeof generateText> {
  for (let essai = 1; ; essai++) {
    try {
      return await generateText({ ...options, maxRetries: 0 });
    } catch (e) {
      const limite =
        APICallError.isInstance(e) && e.statusCode === 429 && essai < 4;
      if (!limite) throw e;
      console.log("  quota de tokens par minute atteint, attente 65 s…");
      await new Promise((r) => setTimeout(r, 65_000));
    }
  }
}
