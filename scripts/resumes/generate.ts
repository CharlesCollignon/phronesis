/**
 * Génère les résumés IA des dossiers à partir des textes officiels
 * (dispositif, exposé des motifs, avis du Conseil d'État), jamais du
 * seul titre. Provider configurable via AI_PROVIDER (mistral | openai).
 *
 * Usage :
 *   pnpm resumes:generate [--limit=20] [--duree-max=120]
 *     dossiers sans résumé à jour (ou résumé d'une version antérieure du
 *     prompt), ceux qui ont des scrutins d'abord, puis les plus récents
 *   pnpm resumes:generate --dossiers=DLR…,DLR… [--dry-run]
 *     dossiers précis ; --dry-run n'écrit rien en base et enregistre le
 *     résultat dans data/cache/resumes-essai/<uid>.md
 *
 * Les dossiers sans texte officiel lisible sont ignorés : mieux vaut
 * pas de résumé qu'un résumé deviné à partir d'un titre.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { acteurs, dossiers, resumesIa } from "../../db/schema";
import { urlDossierAn } from "../../lib/urls";
import { type SourceDocument } from "../empreintes/sources";
import { BudgetEpuiseError, genererAvecAttente, getModel } from "../lib/ia";
import { rassemblerSourcesResume } from "./sources";

const PROMPT_VERSION = "v2-textes-officiels";

const SYSTEM = `Tu rédiges les résumés de dossiers parlementaires de Phronesis, un site d'éducation civique dont la règle est « comprendre avant de juger ».

Ta seule source : les textes officiels fournis. Tu écris pour un citoyen sans formation juridique.

Format (Markdown simple, 180 à 300 mots) :
1. Un premier paragraphe de deux phrases, SANS intertitre, compréhensible seul (il sert d'aperçu dans les moteurs de recherche) : la nature du texte et ce qu'il change concrètement.
2. **Ce que prévoit le texte** : 3 à 6 puces, une mesure concrète par puce, dans l'ordre du dispositif. Cite le numéro d'article seulement s'il figure dans le texte fourni.
3. **Pourquoi, selon ses auteurs** : 2 ou 3 phrases tirées de l'exposé des motifs, toujours attribuées (« les auteurs estiment que… », « le Gouvernement avance que… »). Omets cette section si l'exposé des motifs n'est pas fourni.
4. **L'avis du Conseil d'État** : 1 ou 2 phrases, uniquement si cet avis est fourni.

Règles strictes :
- Uniquement ce que disent les textes fournis. Jamais de « pourrait », « sans doute », ni de mesure supposée. Si le dispositif est coupé, résume ce qui est fourni sans prétendre être exhaustif.
- Neutre : aucun jugement, aucun adjectif évaluatif (« ambitieux », « controversé »…), aucun conseil de vote. Les arguments des auteurs sont rapportés, jamais repris à ton compte.
- Pas de chiffres, dates ou montants absents des textes.
- Ne parle pas de l'avancement de la procédure (dates de vote, navette) : la page l'affiche déjà et l'information change.
- Pas de titre en tête, pas de conclusion, pas de formule d'introduction.
- Français simple, phrases courtes, termes juridiques expliqués en quelques mots.`;

function option(nom: string): string | undefined {
  return process.argv
    .find((a) => a.startsWith(`--${nom}=`))
    ?.slice(nom.length + 3);
}

/**
 * Dossiers à résumer : texte AN lisible, pas de résumé dans la version
 * courante du prompt. Ceux qui ont des scrutins publics (les plus
 * consultés) d'abord, puis par activité la plus récente.
 */
async function listerCandidats(): Promise<string[]> {
  const rows = await db.execute<{ uid: string }>(sql`
    SELECT d.uid
    FROM dossiers d
    WHERE EXISTS (
        SELECT 1 FROM documents doc
        WHERE doc.dossier_uid = d.uid
          AND doc.uid ~ '^(PRJL|PION|PNRE)ANR5L[0-9]+B[0-9]+$'
      )
      AND NOT EXISTS (
        SELECT 1 FROM resumes_ia r
        WHERE r.sujet_type = 'dossier'
          AND r.sujet_uid = d.uid
          AND r.prompt_version = ${PROMPT_VERSION}
      )
    ORDER BY
      EXISTS (SELECT 1 FROM scrutins s WHERE s.dossier_uid = d.uid) DESC,
      (SELECT max(a.date) FROM actes a WHERE a.dossier_uid = d.uid) DESC NULLS LAST,
      d.uid DESC
  `);
  return rows.map((r) => r.uid);
}

function blocSource(s: SourceDocument): string {
  const note = s.tronque ? " (extrait, coupé pour la longueur)" : "";
  return `=== ${s.label}${note} ===\n${s.texte}`;
}

/** Retire un éventuel intertitre en tête : le 1er paragraphe sert d'aperçu. */
function nettoyer(text: string): string {
  return text
    .trim()
    .replace(/^#+\s.*\n+/, "")
    .replace(/^\*\*[^*\n]+\*\*\s*\n+/, "")
    .trim();
}

async function auteur(
  acteurUid: string | null,
): Promise<string | null> {
  if (!acteurUid) return null;
  const [a] = await db
    .select({ prenom: acteurs.prenom, nom: acteurs.nom })
    .from(acteurs)
    .where(eq(acteurs.uid, acteurUid))
    .limit(1);
  return a ? `${a.prenom} ${a.nom}` : null;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const cibles = option("dossiers")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const limit = Number(option("limit") ?? 10);
  const dureeMax = Number(option("duree-max") ?? Infinity);
  const { model, modelId } = getModel();

  const uids = cibles ?? (await listerCandidats());
  console.log(
    `${uids.length} dossier(s) ${cibles ? "demandé(s)" : "à résumer"}` +
      `${cibles ? "" : `, limite ${limit}`}` +
      (dryRun ? " — essai, rien n'est écrit en base" : ""),
  );

  const debut = Date.now();
  let generes = 0;
  let ignores = 0;
  let arret: string | null = null;

  for (const uid of uids) {
    if (!cibles && generes >= limit) break;
    if ((Date.now() - debut) / 60_000 > dureeMax) {
      arret = `durée maximale de ${dureeMax} min atteinte`;
      break;
    }

    const [dossier] = await db
      .select()
      .from(dossiers)
      .where(eq(dossiers.uid, uid))
      .limit(1);
    if (!dossier) {
      console.warn(`Dossier introuvable : ${uid}`);
      continue;
    }

    let sourcesDocs: SourceDocument[];
    try {
      sourcesDocs = await rassemblerSourcesResume(dossier.uid);
    } catch (e) {
      console.warn(`  ${uid} : sources illisibles (${(e as Error).message})`);
      ignores += 1;
      continue;
    }
    if (sourcesDocs.length === 0) {
      console.log(`  ${uid} : aucun texte officiel lisible, ignoré`);
      ignores += 1;
      continue;
    }

    const nomAuteur = await auteur(dossier.initiateurActeurUid);
    const prompt =
      `Dossier : ${dossier.titre}\n` +
      `Procédure : ${dossier.procedureLibelle ?? "non précisée"}\n` +
      (nomAuteur ? `Premier signataire : ${nomAuteur}\n` : "") +
      `\n${sourcesDocs.map(blocSource).join("\n\n")}\n\n` +
      `Rédige le résumé.`;

    console.log(
      `→ ${dossier.uid} — ${dossier.titre.slice(0, 70)}\n` +
        `  sources : ${sourcesDocs.map((s) => `${s.label} (${s.texte.length} car.)`).join(", ")}`,
    );

    let text: string;
    try {
      const res = await genererAvecAttente({
        model,
        system: SYSTEM,
        prompt,
        temperature: 0.2,
      });
      text = nettoyer(res.text);
      console.log(
        `  tokens : ${res.usage.inputTokens ?? "?"} en entrée, ${res.usage.outputTokens ?? "?"} en sortie`,
      );
    } catch (e) {
      if (e instanceof BudgetEpuiseError) {
        arret = "budget mensuel de l'API épuisé";
        break;
      }
      console.warn(`  ${uid} en échec : ${(e as Error).message}`);
      ignores += 1;
      continue;
    }

    if (text.length < 300) {
      console.warn(`  ${uid} : réponse trop courte, ignorée`);
      ignores += 1;
      continue;
    }

    const sources: { label: string; url: string }[] = [];
    const official = urlDossierAn(dossier.legislature, dossier.titreChemin);
    if (official) {
      sources.push({ label: "Dossier Assemblée nationale", url: official });
    }
    for (const s of sourcesDocs) sources.push({ label: s.label, url: s.url });

    if (dryRun) {
      const dir = path.join(process.cwd(), "data", "cache", "resumes-essai");
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, `${dossier.uid}.md`),
        `# ${dossier.titre}\n\n${text}\n\n---\n${sources.map((s) => `- ${s.label} : ${s.url}`).join("\n")}\n`,
      );
      generes += 1;
      continue;
    }

    await db
      .insert(resumesIa)
      .values({
        sujetType: "dossier",
        sujetUid: dossier.uid,
        contenu: text,
        modele: modelId,
        promptVersion: PROMPT_VERSION,
        sources,
      })
      .onConflictDoUpdate({
        target: [resumesIa.sujetType, resumesIa.sujetUid],
        set: {
          contenu: text,
          modele: modelId,
          promptVersion: PROMPT_VERSION,
          sources,
          genereLe: new Date(),
        },
      });
    generes += 1;
  }

  console.log(
    `${arret ? `Arrêt (${arret}) : ` : "Terminé : "}` +
      `${generes} résumé(s), ${ignores} ignoré(s), ` +
      `${Math.round((Date.now() - debut) / 60_000)} min.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
