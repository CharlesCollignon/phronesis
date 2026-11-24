/**
 * Rafraîchit le cache du site après un batch : invalide ce qui a
 * changé, puis relit aussitôt les pages concernées.
 *
 * Neon se facture au temps d'éveil, par tranches de 5 minutes. Relire
 * quelques milliers de pages d'un trait, pendant que le batch le tient
 * éveillé, coûte quelques minutes de calcul ; laisser visiteurs et
 * robots les relire une par une au fil de la semaine le tient éveillé
 * presque en continu.
 *
 * Usage :
 *   pnpm cache:rafraichir
 *     listes, élus, groupes, et les fiches que les batchs ont notées
 *     dans `invalidations_cache`.
 *   pnpm cache:rafraichir --tout
 *     toutes les fiches en plus. À lancer après un changement de
 *     CACHE_VERSION (lib/cache.ts) ou de logique d'ingestion.
 *   Options : --sans-rechauffage, --concurrence=8
 *
 * Variables : DATABASE_URL, REVALIDATE_SECRET, et SITE_URL (par défaut
 * le site de production).
 */
import { sql } from "drizzle-orm";

import { db } from "../../db";
import { invalidationsCache } from "../../db/schema";
import { FICHES_TAG, cheminFiche, estTagFiche } from "../../lib/cache-tags";

const SITE = (
  process.env.SITE_URL ?? "https://www.phronesis-france.com"
).replace(/\/$/, "");

/** Étiquettes par appel à /api/revalidate (la route en accepte 500). */
const PAR_APPEL = 200;
/** Au-delà, invalider fiche par fiche n'a plus d'intérêt : on relit tout. */
const SEUIL_TOUT = 4000;
/** Lignes par page des listes /scrutins et /dossiers. */
const PAR_PAGE = 40;
const DELAI_MS = 60_000;
const AGENT = "phronesis-cache/1.0 (rechauffage apres ingestion)";

function option(nom: string): string | undefined {
  return process.argv
    .find((a) => a.startsWith(`--${nom}=`))
    ?.slice(nom.length + 3);
}

function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function invalider(corps: {
  fiches?: string[];
  tout?: boolean;
}): Promise<void> {
  let derniere: unknown;
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const res = await fetch(`${SITE}/api/revalidate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REVALIDATE_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(DELAI_MS),
      });
      if (res.ok) return;
      derniere = new Error(`HTTP ${res.status} : ${await res.text()}`);
      // Secret refusé ou corps invalide : réessayer ne changera rien.
      if (res.status < 500) break;
    } catch (e) {
      derniere = e;
    }
    await attendre(2000 * essai);
  }
  throw derniere;
}

type Bilan = { lues: number; absentes: number; echecs: string[] };

/** GET d'une page ; renvoie son contenu, ou null si elle n'a pu être lue. */
async function lire(chemin: string, bilan: Bilan): Promise<string | null> {
  for (let essai = 1; essai <= 2; essai++) {
    try {
      const res = await fetch(`${SITE}${chemin}`, {
        headers: { "User-Agent": AGENT },
        signal: AbortSignal.timeout(DELAI_MS),
      });
      const texte = await res.text();
      if (res.ok) {
        bilan.lues += 1;
        return texte;
      }
      // Fiche notée mais sans page (identifiant hors site) : normal.
      if (res.status === 404) {
        bilan.absentes += 1;
        return null;
      }
    } catch {
      /* nouvel essai */
    }
    if (essai === 1) await attendre(1500);
  }
  bilan.echecs.push(chemin);
  return null;
}

async function lireEnParallele(
  chemins: string[],
  concurrence: number,
  bilan: Bilan,
): Promise<void> {
  let suivant = 0;
  const travailleur = async (): Promise<void> => {
    while (suivant < chemins.length) {
      const i = suivant++;
      await lire(chemins[i]!, bilan);
      if ((i + 1) % 500 === 0) {
        console.log(`  … ${i + 1} / ${chemins.length} pages`);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrence }, travailleur));
}

/** Chemins listés par un sitemap du site (les <loc> sont absolus). */
function cheminsDuSitemap(xml: string | null): string[] {
  if (!xml) return [];
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    const url = new URL(m[1]!.replaceAll("&amp;", "&"));
    return url.pathname + url.search;
  });
}

function pages(base: string, lignes: number): string[] {
  const sep = base.includes("?") ? "&" : "?";
  const n = Math.ceil(lignes / PAR_PAGE);
  return Array.from({ length: Math.max(0, n - 1) }, (_, i) => {
    return `${base}${sep}page=${i + 2}`;
  });
}

async function main(): Promise<void> {
  if (!process.env.REVALIDATE_SECRET) {
    throw new Error(
      "REVALIDATE_SECRET manquant : le site garderait les anciennes données.",
    );
  }
  const concurrence = Math.max(1, Number(option("concurrence") ?? 8) || 8);
  const debut = Date.now();

  // 1. Invalider. Les étiquettes sont retirées de la file dans la
  // transaction qui les envoie au site : si l'envoi échoue, elles y
  // restent ; et un batch qui noterait la même étiquette au même moment
  // attend la fin de l'envoi, sa note est gardée pour la prochaine fois.
  const { fiches, tout } = await db.transaction(async (tx) => {
    const notees = (
      await tx
        .delete(invalidationsCache)
        .returning({ tag: invalidationsCache.tag })
    ).map((r) => r.tag);
    const fiches = notees.filter(estTagFiche);
    const tout =
      process.argv.includes("--tout") ||
      notees.includes(FICHES_TAG) ||
      fiches.length > SEUIL_TOUT;

    console.log(
      `${SITE} : ` +
        (tout
          ? "toutes les fiches sont invalidées"
          : `${fiches.length} fiche(s) invalidée(s)`) +
        ", ainsi que les listes, élus et groupes",
    );
    if (tout) {
      await invalider({ tout: true });
    } else {
      // Sans fiche notée, un appel vide suffit : il invalide les listes.
      await invalider({ fiches: fiches.slice(0, PAR_APPEL) });
      for (let i = PAR_APPEL; i < fiches.length; i += PAR_APPEL) {
        await invalider({ fiches: fiches.slice(i, i + PAR_APPEL) });
      }
    }
    return { fiches, tout };
  });

  if (process.argv.includes("--sans-rechauffage")) {
    console.log("Cache invalidé, pages non relues (--sans-rechauffage).");
    return;
  }

  // 2. Relire. D'abord, une à une, les pages qui chargent les lectures
  // communes à beaucoup d'autres (indicateurs de tous les députés,
  // effectifs des groupes…) : sinon chaque requête parallèle les
  // recalculerait de son côté.
  const bilan: Bilan = { lues: 0, absentes: 0, echecs: [] };
  const sitemap = cheminsDuSitemap(await lire("/sitemap.xml", bilan));
  const deputes = cheminsDuSitemap(await lire("/deputes/sitemap.xml", bilan));
  const senateurs = cheminsDuSitemap(
    await lire("/senateurs/sitemap.xml", bilan),
  );
  const sitemapDossiers = await lire("/dossiers/sitemap.xml", bilan);
  const sitemapScrutins = await lire("/scrutins/sitemap.xml", bilan);
  const groupes = sitemap.filter((c) => c.startsWith("/groupes/"));

  const amorce = [
    "/",
    "/deputes",
    "/senateurs",
    "/groupes",
    "/groupes?chambre=SENAT",
    "/scrutins",
    "/dossiers",
    "/actualite",
    "/methodologie",
    "/comparateur",
    "/comparateur?type=senateurs",
    "/comparateur?type=groupes",
    "/comparateur?type=groupes_senat",
    ...deputes.slice(0, 1),
    ...senateurs.slice(0, 1),
    ...groupes.slice(0, 1),
  ];
  for (const chemin of amorce) await lire(chemin, bilan);

  const [compte] = await db.execute<{
    scrutins: number;
    an: number;
    senat: number;
    dossiers: number;
  }>(sql`
    SELECT
      (SELECT count(*)::int FROM scrutins) AS scrutins,
      (SELECT count(*)::int FROM scrutins WHERE chambre = 'AN') AS an,
      (SELECT count(*)::int FROM scrutins WHERE chambre = 'SENAT') AS senat,
      (SELECT count(*)::int FROM dossiers WHERE legislature = 17) AS dossiers
  `);

  const reste = new Set<string>([
    ...sitemap,
    ...deputes,
    ...senateurs,
    "/scrutins?chambre=AN",
    "/scrutins?chambre=SENAT",
    ...pages("/scrutins", Number(compte?.scrutins ?? 0)),
    ...pages("/scrutins?chambre=AN", Number(compte?.an ?? 0)),
    ...pages("/scrutins?chambre=SENAT", Number(compte?.senat ?? 0)),
    ...pages("/dossiers", Number(compte?.dossiers ?? 0)),
    ...(tout
      ? [
          ...cheminsDuSitemap(sitemapDossiers),
          ...cheminsDuSitemap(sitemapScrutins),
        ]
      : fiches.map(cheminFiche).filter((c): c is string => c !== null)),
  ]);
  for (const chemin of amorce) reste.delete(chemin);

  console.log(
    `Relecture de ${reste.size} pages (${concurrence} à la fois)…`,
  );
  await lireEnParallele([...reste], concurrence, bilan);

  console.log(
    `Terminé en ${Math.round((Date.now() - debut) / 1000)} s : ` +
      `${bilan.lues} pages relues, ${bilan.absentes} sans page, ` +
      `${bilan.echecs.length} en échec.`,
  );
  if (bilan.echecs.length > 0) {
    // Sans gravité pour les données : ces pages seront relues à leur
    // prochaine visite, au prix d'un réveil de la base chacune.
    console.warn(
      `Pages non relues : ${bilan.echecs.slice(0, 20).join(", ")}` +
        (bilan.echecs.length > 20 ? "…" : ""),
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
