import { sql } from "drizzle-orm";

import { db } from "../../db";
import { amendements, documents, dossiers } from "../../db/schema";
import {
  DATASETS,
  asDate,
  asInt,
  asText,
  download,
  forEachZipEntry,
  logImport,
} from "./lib";

type Json = Record<string, unknown>;
type AmendementRow = typeof amendements.$inferInsert;

/** Retire les balises HTML les plus courantes des dumps AN. */
function stripHtml(value: string | null): string | null {
  if (!value) return null;
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&#x00E0;/gi, "à")
    .replace(/&#x00E9;/gi, "é")
    .replace(/&#x00E8;/gi, "è")
    .replace(/&#x00EA;/gi, "ê")
    .replace(/&#x00F9;/gi, "ù")
    .replace(/&#x00FB;/gi, "û")
    .replace(/&#x00E7;/gi, "ç")
    .replace(/&#x00AB;/gi, "«")
    .replace(/&#x00BB;/gi, "»")
    .replace(/&#x2019;/gi, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function dossierUidFromPath(entryPath: string): string | null {
  const m = entryPath.match(/\/(DLR5L\d+N\d+)\//);
  return m?.[1] ?? null;
}

function parseAmendement(
  entryPath: string,
  raw: Json,
): AmendementRow | null {
  const a = raw.amendement as Json | undefined;
  if (!a) return null;
  const uid = asText(a.uid);
  if (!uid) return null;

  const identification = (a.identification ?? {}) as Json;
  const signataires = (a.signataires ?? {}) as Json;
  const auteur = (signataires.auteur ?? {}) as Json;
  const pointeur = (a.pointeurFragmentTexte ?? {}) as Json;
  const division = (pointeur.division ?? {}) as Json;
  const corps = (a.corps ?? {}) as Json;
  const contenu = (corps.contenuAuteur ?? {}) as Json;
  const cycle = (a.cycleDeVie ?? {}) as Json;
  const etatDes = (cycle.etatDesTraitements ?? {}) as Json;
  const etat = (etatDes.etat ?? {}) as Json;
  const sousEtat = (etatDes.sousEtat ?? {}) as Json;

  return {
    uid,
    numeroLong: asText(identification.numeroLong),
    legislature: asInt(a.legislature),
    texteRef: asText(a.texteLegislatifRef),
    dossierUid: dossierUidFromPath(entryPath),
    auteurType: asText(auteur.typeAuteur),
    auteurActeurUid: asText(auteur.acteurRef),
    auteurGroupeUid: asText(auteur.groupePolitiqueRef),
    articleDesignation: asText(division.articleDesignation),
    dispositif: stripHtml(asText(contenu.dispositif)),
    exposeSommaire: stripHtml(asText(contenu.exposeSommaire)),
    sort: asText(cycle.sort) ?? asText(sousEtat.libelle),
    etat: asText(etat.libelle),
    dateDepot: asDate(cycle.dateDepot),
  };
}

function sqlExcluded(column: string): ReturnType<typeof sql> {
  return sql.raw(`excluded."${column}"`);
}

async function main(): Promise<void> {
  const start = Date.now();
  const zipPath = await download(DATASETS.amendements);

  const texteToDossier = new Map<string, string>();
  const docs = await db
    .select({
      uid: documents.uid,
      dossierUid: documents.dossierUid,
    })
    .from(documents);
  for (const d of docs) {
    if (d.dossierUid) texteToDossier.set(d.uid, d.dossierUid);
  }

  const dossierRows = await db.select({ uid: dossiers.uid }).from(dossiers);
  const dossierUids = new Set(dossierRows.map((r) => r.uid));

  let parsed = 0;
  let buffer: AmendementRow[] = [];

  const flush = async (): Promise<void> => {
    if (buffer.length === 0) return;
    const batch = buffer;
    buffer = [];
    await db
      .insert(amendements)
      .values(batch)
      .onConflictDoUpdate({
        target: amendements.uid,
        set: {
          numeroLong: sqlExcluded("numero_long"),
          dossierUid: sqlExcluded("dossier_uid"),
          texteRef: sqlExcluded("texte_ref"),
          auteurType: sqlExcluded("auteur_type"),
          auteurActeurUid: sqlExcluded("auteur_acteur_uid"),
          auteurGroupeUid: sqlExcluded("auteur_groupe_uid"),
          articleDesignation: sqlExcluded("article_designation"),
          dispositif: sqlExcluded("dispositif"),
          exposeSommaire: sqlExcluded("expose_sommaire"),
          sort: sqlExcluded("sort"),
          etat: sqlExcluded("etat"),
          dateDepot: sqlExcluded("date_depot"),
        },
      });
  };

  await forEachZipEntry(
    zipPath,
    (p) => p.endsWith(".json"),
    async (p, content) => {
      const row = parseAmendement(p, JSON.parse(content) as Json);
      if (!row) return;

      if (
        (!row.dossierUid || !dossierUids.has(row.dossierUid)) &&
        row.texteRef
      ) {
        row.dossierUid = texteToDossier.get(row.texteRef) ?? null;
      }
      if (row.dossierUid && !dossierUids.has(row.dossierUid)) {
        row.dossierUid = null;
      }

      buffer.push(row);
      parsed++;
      if (buffer.length >= 2000) {
        await flush();
      }
    },
  );
  await flush();

  const duration = Date.now() - start;
  await logImport("amendements", DATASETS.amendements.url, parsed, duration);
  console.log(
    `Import amendements terminé : ${parsed} lignes en ` +
      `${Math.round(duration / 1000)}s`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
