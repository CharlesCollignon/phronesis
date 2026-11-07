/**
 * Classe les amendements mis aux voix (scrutins publics AN) : nature,
 * thèmes, orientation propre à chaque thème, catégories qui y gagnent
 * ou y perdent. Le modèle ne voit ni l'auteur ni son groupe : seulement
 * le contenu de l'amendement, pour que l'analyse des groupes à partir de
 * ces classements ne soit pas circulaire.
 *
 * Usage :
 *   pnpm amendements:classer [-- --limit=N]
 *     classe les amendements votés pas encore classés avec cette version
 *     du prompt, et écrit après chaque lot : relancer reprend où l'on en
 *     était.
 *   pnpm amendements:classer -- --essai [--limit=100] [--raisonnement=high]
 *     écrit dans data/cache/amendements-essai au lieu de la base.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { sql } from "drizzle-orm";

import { db } from "../../db";
import { amendementsClassements } from "../../db/schema";
import {
  CATEGORIES,
  CONFIANCES,
  NATURES,
  ORIENTATIONS,
  THEMES,
  isCategorie,
  isTheme,
} from "../../lib/amendements-classement";
import { decoderEntites } from "../../lib/format";
import { extractJson, genererAvecAttente, getModel } from "../lib/ia";

const PROMPT_VERSION = "v2-orientation-par-theme";
const PAR_APPEL = 10;
const MAX_CARACTERES = 1500;
const ECHECS_CONSECUTIFS_MAX = 5;

const listeOrientations = Object.entries(ORIENTATIONS)
  .map(([theme, [a, b]]) => `  ${theme} : ${a.id} | ${b.id}`)
  .join("\n");

const SYSTEM = `Tu classes des amendements parlementaires français pour Phronesis.
Analyse neutre et factuelle : jamais de jugement moral, jamais de conseil
de vote. Tu ne connais pas l'auteur de l'amendement : juge uniquement son
contenu.

Pour chaque amendement, donne :
- nature :
  redactionnel = coordination, correction, précision, date, intitulé :
    aucun effet de fond ;
  rapport = demande un rapport ou une évaluation au Gouvernement ;
  suppression = supprime un article ou une disposition ;
  ajout = crée une disposition nouvelle ;
  modification = change une disposition existante.
- themes : 1 ou 2 parmi ${THEMES.join(", ")}
- resume : 25 mots au plus, ce que l'amendement change concrètement
- orientations : pour chaque thème qui a des pôles ci-dessous, le pôle vers
  lequel l'amendement pousse, sous la forme { "theme", "sens" } ; omets le
  thème si l'effet n'est pas clair.
${listeOrientations}
- gagnants, perdants : catégories directement favorisées ou pénalisées,
  parmi ${CATEGORIES.join(", ")} ; [] si rien de direct et clair
- confiance : haute | moyenne | basse

Méthode :
- Juge l'effet du dispositif, pas l'intention affichée dans l'exposé.
- Une suppression produit l'effet inverse de ce qu'elle supprime : déduis-le
  de l'exposé ; si c'est impossible, confiance basse et orientations [].
- redactionnel et rapport : orientations, gagnants et perdants vides.
- N'invente pas d'effet : un amendement mineur a des listes vides.

Réponds UNIQUEMENT avec un tableau JSON compact (sans texte autour), un
objet par amendement, dans l'ordre reçu : { "id", "nature", "themes",
"resume", "orientations", "gagnants", "perdants", "confiance" }.`;

type Amendement = {
  uid: string;
  numero: string | null;
  article: string | null;
  dispositif: string | null;
  expose: string | null;
  dossier: string | null;
  groupe: string | null;
  sort: string | null;
};

type Classement = typeof amendementsClassements.$inferInsert;

function option(nom: string): string | undefined {
  return process.argv
    .find((a) => a.startsWith(`--${nom}=`))
    ?.slice(nom.length + 3);
}

function couper(texte: string | null): string {
  const t = decoderEntites(texte).replace(/\s+/g, " ").trim();
  return t.length > MAX_CARACTERES ? `${t.slice(0, MAX_CARACTERES)}…` : t;
}

function liste(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/**
 * Valide la réponse du modèle. Les orientations arrivent sous deux
 * formes : { "theme": "x", "sens": "y" } ou { "x": "y" }.
 */
function normaliser(
  brut: Record<string, unknown>,
  amendementUid: string,
  modele: string,
): Classement | null {
  const nature = String(brut.nature ?? "");
  const resume = String(brut.resume ?? "").trim();
  if (!(NATURES as readonly string[]).includes(nature) || !resume) {
    return null;
  }
  const sansEffet = nature === "redactionnel" || nature === "rapport";

  const orientations: { theme: string; sens: string }[] = [];
  for (const o of liste(brut.orientations)) {
    if (typeof o !== "object" || o == null) continue;
    const rec = o as Record<string, unknown>;
    const paires = "theme" in rec ? [[rec.theme, rec.sens]] : Object.entries(rec);
    for (const [theme, sens] of paires) {
      const poles = isTheme(theme) ? ORIENTATIONS[theme] : undefined;
      if (poles && poles.some((p) => p.id === sens)) {
        orientations.push({ theme: theme as string, sens: sens as string });
      }
    }
  }

  const confiance = String(brut.confiance ?? "");
  return {
    amendementUid,
    nature,
    themes: liste(brut.themes).filter(isTheme).slice(0, 2),
    resume,
    orientations: sansEffet ? [] : orientations,
    gagnants: sansEffet ? [] : liste(brut.gagnants).filter(isCategorie),
    perdants: sansEffet ? [] : liste(brut.perdants).filter(isCategorie),
    confiance: (CONFIANCES as readonly string[]).includes(confiance)
      ? confiance
      : "basse",
    modele,
    promptVersion: PROMPT_VERSION,
  };
}

async function chargerAmendements(
  limit: number,
  essai: boolean,
): Promise<Amendement[]> {
  const rows = await db.execute<Amendement>(sql`
    SELECT a.uid, a.numero_long AS numero,
      a.article_designation AS article, a.dispositif,
      a.expose_sommaire AS expose, d.titre AS dossier,
      o.libelle_abrege AS groupe, a.sort
    FROM amendements a
    LEFT JOIN dossiers d ON d.uid = a.dossier_uid
    LEFT JOIN organes o ON o.uid = a.auteur_groupe_uid
    WHERE a.dispositif IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM scrutins s WHERE s.amendement_uid = a.uid
      )
      ${
        essai
          ? sql``
          : sql`AND NOT EXISTS (
              SELECT 1 FROM amendements_classements c
              WHERE c.amendement_uid = a.uid
                AND c.prompt_version = ${PROMPT_VERSION}
            )`
      }
    ORDER BY md5(a.uid)
    LIMIT ${limit}
  `);
  return Array.from(rows);
}

function bloc(a: Amendement): string {
  return [
    `### id: ${a.uid}`,
    `Texte : ${a.dossier ?? "non précisé"}`,
    `Article visé : ${a.article ?? "non précisé"}`,
    `Dispositif : ${couper(a.dispositif)}`,
    `Exposé sommaire : ${couper(a.expose) || "(aucun)"}`,
  ].join("\n");
}

async function main(): Promise<void> {
  const essai = process.argv.includes("--essai");
  const limit = Number(option("limit") ?? (essai ? 100 : 100_000));
  const raisonnement = option("raisonnement") === "high" ? "high" : "none";

  const amendements = await chargerAmendements(limit, essai);
  const { model, modelId } = getModel();
  console.log(
    `${amendements.length} amendements à classer, ${PAR_APPEL} par appel, ` +
      `raisonnement ${raisonnement}` +
      (essai ? " — essai, rien n'est écrit en base" : ""),
  );

  const resultatsEssai: unknown[] = [];
  let classes = 0;
  let rejetes = 0;
  let echecs = 0;
  const debut = Date.now();

  for (let i = 0; i < amendements.length; i += PAR_APPEL) {
    const lot = amendements.slice(i, i + PAR_APPEL);
    let reponses: Record<string, unknown>[];
    try {
      const { text } = await genererAvecAttente({
        model,
        system: SYSTEM,
        prompt: `${lot.map(bloc).join("\n\n")}\n\nProduis le tableau JSON.`,
        temperature: 0,
        topP: 1,
        providerOptions: { mistral: { reasoningEffort: raisonnement } },
      });
      reponses = liste(extractJson(text)) as Record<string, unknown>[];
      echecs = 0;
    } catch (e) {
      echecs += 1;
      console.warn(
        `  lot ${i / PAR_APPEL + 1} en échec : ${(e as Error).message}`,
      );
      if (echecs >= ECHECS_CONSECUTIFS_MAX) {
        throw new Error(`${echecs} lots en échec d'affilée, arrêt.`);
      }
      continue;
    }

    const valides: Classement[] = [];
    for (const a of lot) {
      const brut = reponses.find((r) => r.id === a.uid);
      const c = brut ? normaliser(brut, a.uid, modelId) : null;
      if (!c) {
        rejetes += 1;
        continue;
      }
      valides.push(c);
      if (essai) resultatsEssai.push({ ...a, classement: c });
    }

    if (!essai && valides.length > 0) {
      await db
        .insert(amendementsClassements)
        .values(valides)
        .onConflictDoUpdate({
          target: amendementsClassements.amendementUid,
          set: {
            nature: sql`excluded.nature`,
            themes: sql`excluded.themes`,
            resume: sql`excluded.resume`,
            orientations: sql`excluded.orientations`,
            gagnants: sql`excluded.gagnants`,
            perdants: sql`excluded.perdants`,
            confiance: sql`excluded.confiance`,
            modele: sql`excluded.modele`,
            promptVersion: sql`excluded.prompt_version`,
            genereLe: sql`now()`,
          },
        });
    }
    classes += valides.length;

    const fait = Math.min(i + PAR_APPEL, amendements.length);
    if (fait % 100 === 0 || fait === amendements.length) {
      const minutes = (Date.now() - debut) / 60_000;
      const restant = ((amendements.length - fait) / fait) * minutes;
      console.log(
        `  ${fait}/${amendements.length} — ${classes} classés, ${rejetes} rejetés — ` +
          `${Math.round(minutes)} min écoulées, ~${Math.round(restant)} min restantes`,
      );
    }
  }

  if (essai) {
    const sortie = path.join(
      "data",
      "cache",
      "amendements-essai",
      `classement-${PROMPT_VERSION}-${raisonnement}.json`,
    );
    await mkdir(path.dirname(sortie), { recursive: true });
    await writeFile(
      sortie,
      JSON.stringify(
        {
          modele: modelId,
          promptVersion: PROMPT_VERSION,
          raisonnement,
          resultats: resultatsEssai,
        },
        null,
        2,
      ),
    );
    console.log(`Écrit dans ${sortie}`);
  }
  console.log(`Terminé : ${classes} classés, ${rejetes} rejetés.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
