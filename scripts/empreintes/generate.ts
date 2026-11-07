/**
 * Génère des empreintes civiques qualitatives (batch).
 * Provider configurable via AI_PROVIDER (mistral | openai).
 *
 * Usage :
 *   pnpm empreintes:generate [--limit=10]
 *     dossiers sans empreinte
 *   pnpm empreintes:generate --dossiers=DLR…,DLR… [--dry-run]
 *     dossiers précis (régénère s'ils en ont déjà une) ; --dry-run
 *     n'écrit rien en base et enregistre le résultat dans
 *     data/cache/empreintes-essai/<uid>.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, generateText } from "ai";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { documents, dossiers, empreintes } from "../../db/schema";
import {
  AXES_EMPREINTE,
  isAxeEmpreinte,
  isImpactEmpreinte,
  type AxeEmpreinte,
  type ImpactEmpreinte,
} from "../../lib/empreinte";
import { listDossiersSansEmpreinte } from "../../lib/queries";
import { urlDossierAn } from "../../lib/urls";
import { rassemblerSources, type SourceDocument } from "./sources";

const PROMPT_VERSION = "v2.1-effets-sources-officielles";

type AxeResult = {
  axe: AxeEmpreinte;
  impact: ImpactEmpreinte;
  justification: string;
};

const SYSTEM = `Tu analyses des textes législatifs français pour Phronesis.
Tu produis une empreinte civique QUALITATIVE : jamais de note numérique,
jamais de jugement moral (bon/mauvais), jamais de conseil de vote.

Pour chaque axe, choisis un seul impact parmi :
renforce | restreint | mitige | non_aborde | indetermine

Ce que mesure chaque axe, par rapport au droit existant :
- liberte : liberté d'agir des personnes et des entreprises (aller et
  venir, s'exprimer, entreprendre, contracter, choisir sa vie).
  Restreint : interdiction, obligation, autorisation préalable, nouvelle
  sanction, contrôle. Renforce : levée d'une interdiction ou d'une
  contrainte, nouveau droit d'agir.
- egalite : égalité de traitement et de conditions entre personnes ou
  territoires. Renforce : réduit une différence de traitement ou un
  écart. Restreint : crée ou étend un régime différencié, avantage une
  catégorie, creuse un écart.
- securite : protection contre les atteintes aux personnes et aux biens,
  et contre les risques sanitaires ou militaires. Renforce : nouveaux
  moyens de prévention, de protection ou de répression. Restreint :
  réduit ces moyens.
- vie_privee : protection des données personnelles et de l'intimité.
  Restreint : nouvelle collecte, fichier, croisement, accès élargi,
  surveillance. Renforce : limite la collecte, crée des droits.
- solidarite : protection collective et redistribution (prestations,
  services publics, aides). Renforce : élargit. Restreint : réduit,
  conditionne davantage ou supprime.
- responsabilite_individuelle : répartition d'une charge ou d'un risque
  entre la personne et la collectivité (contreparties aux aides,
  sanctions personnelles, prise en charge par soi-même). Renforce : fait
  davantage reposer la charge sur la personne. Restreint : la transfère
  à la collectivité. Supprimer une obligation entre particuliers relève
  de la liberté, pas de cet axe.
- etat_de_droit : garanties juridictionnelles, droits de la défense,
  recours, contrôle du juge, séparation des pouvoirs, sécurité
  juridique. Restreint : réduit un recours ou une garantie, contourne le
  juge, déroge à une règle protectrice, ou dispositions dont le Conseil
  d'État signale le risque constitutionnel ou conventionnel. Renforce :
  ajoute des garanties.
- efficacite_economique : coûts, charges et contraintes pesant sur
  l'activité économique. Renforce : les allège ou stimule l'activité.
  Restreint : ajoute des coûts, des charges ou des contraintes.
- durabilite : environnement, climat, biodiversité, ressources.
  Renforce : protège. Restreint : assouplit une protection ou autorise
  une atteinte.
- souverainete : autonomie de la France vis-à-vis de l'étranger
  (dépendances alimentaires, énergétiques, militaires, numériques ;
  marge de décision face aux normes européennes ou internationales).
  Les pouvoirs de l'État à l'intérieur du pays ne relèvent pas de cet
  axe.

Méthode :
- Juge les EFFETS des dispositions par rapport au droit existant, pas
  les intentions affichées. L'exposé des motifs et l'étude d'impact sont
  écrits par l'auteur du texte : ils décrivent ses objectifs. Ne reprends
  pas ses qualificatifs.
- Pour chaque axe, cherche explicitement ce que le texte interdit,
  impose, retire, conditionne ou contourne, et pas seulement ce qu'il
  ajoute. Une même disposition peut renforcer un axe et en restreindre un
  autre (une interdiction peut renforcer la sécurité et restreindre la
  liberté).
- mitige : effets significatifs dans les deux sens sur le même axe.
- non_aborde : aucune disposition ne touche l'axe de façon notable.
  Préfère non_aborde à un « renforce » faible ou indirect.
- indetermine : les sources ne permettent pas de trancher.
- Si l'avis du Conseil d'État relève un risque juridique, une atteinte
  disproportionnée ou une disposition qu'il a écartée, tiens-en compte.

Justification : 1 à 3 phrases factuelles, sans adjectif partisan. Cite
l'article concerné (« art. 3 ») et dis qui gagne une capacité ou supporte
une contrainte.

Réponds UNIQUEMENT avec un JSON valide : un tableau de 10 objets
{ "axe": "...", "impact": "...", "justification": "..." }, un objet par
axe, dans cet ordre : ${AXES_EMPREINTE.join(", ")}.`;

function getModel(): {
  model: ReturnType<ReturnType<typeof createMistral>>;
  modelId: string;
} {
  const provider = (process.env.AI_PROVIDER ?? "mistral").toLowerCase();
  const modelId =
    process.env.AI_MODEL ??
    (provider === "openai" ? "gpt-4o-mini" : "mistral-large-latest");

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

function parseDossiers(): string[] | null {
  const arg = process.argv.find((a) => a.startsWith("--dossiers="));
  if (!arg) return null;
  return arg
    .slice("--dossiers=".length)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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

/**
 * Appel au modèle qui attend la fin de la fenêtre d'une minute quand
 * le quota de tokens par minute est atteint (offres Mistral limitées).
 */
async function genererAvecAttente(
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

function blocSource(s: SourceDocument): string {
  const note = s.tronque ? " (extrait, coupé pour la longueur)" : "";
  return `=== ${s.label}${note} ===\n${s.texte}`;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const cibles = parseDossiers();
  const { model, modelId } = getModel();

  const uids =
    cibles ??
    (await listDossiersSansEmpreinte(parseLimit())).map((d) => d.uid);
  console.log(
    `${uids.length} dossier(s) ${cibles ? "demandé(s)" : "sans empreinte"}` +
      (dryRun ? " — essai, rien n'est écrit en base" : ""),
  );

  for (const uid of uids) {
    const [dossier] = await db
      .select()
      .from(dossiers)
      .where(eq(dossiers.uid, uid))
      .limit(1);
    if (!dossier) {
      console.warn(`Dossier introuvable : ${uid}`);
      continue;
    }

    const sourcesDocs = await rassemblerSources(dossier.uid);

    // Sans document lisible, on retombe sur les titres : le modèle
    // doit alors répondre « indetermine » plutôt que deviner.
    let corps: string;
    if (sourcesDocs.length > 0) {
      corps = sourcesDocs.map(blocSource).join("\n\n");
    } else {
      const titres = await db
        .select({ titre: documents.titre, typeCode: documents.typeCode })
        .from(documents)
        .where(eq(documents.dossierUid, dossier.uid))
        .limit(12);
      corps =
        "Aucun texte officiel lisible : seuls les titres des documents " +
        "sont disponibles.\n" +
        (titres.map((d) => `- [${d.typeCode ?? "?"}] ${d.titre}`).join("\n") ||
          "(aucun)");
    }

    const prompt =
      `Dossier : ${dossier.titre}\n` +
      `Procédure : ${dossier.procedureLibelle ?? "non précisée"}\n\n` +
      `${corps}\n\nProduis le JSON des 10 axes.`;

    console.log(
      `→ ${dossier.uid} — ${dossier.titre.slice(0, 70)}\n` +
        `  sources : ${sourcesDocs.map((s) => `${s.label} (${s.texte.length} car.)`).join(", ") || "titres seulement"}`,
    );

    const { text, usage } = await genererAvecAttente({
      model,
      system: SYSTEM,
      prompt,
      temperature: 0.2,
    });
    console.log(
      `  tokens : ${usage.inputTokens ?? "?"} en entrée, ${usage.outputTokens ?? "?"} en sortie`,
    );

    const axes = parseAxes(extractJson(text));

    const sources: { label: string; url: string }[] = [];
    const official = urlDossierAn(dossier.legislature, dossier.titreChemin);
    if (official) {
      sources.push({ label: "Dossier Assemblée nationale", url: official });
    }
    for (const s of sourcesDocs) sources.push({ label: s.label, url: s.url });

    if (dryRun) {
      const dir = path.join(process.cwd(), "data", "cache", "empreintes-essai");
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, `${dossier.uid}.json`),
        JSON.stringify(
          { dossier: dossier.uid, titre: dossier.titre, modele: modelId, promptVersion: PROMPT_VERSION, sources, axes },
          null,
          2,
        ),
      );
      continue;
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
