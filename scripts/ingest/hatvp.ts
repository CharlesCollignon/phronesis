/**
 * Ingest HATVP : lie les acteurs parlementaires à leur fiche
 * nominative publique (CSV open data).
 *
 * Match strict :
 * - député : id_origine → PA{id}
 * - sénateur : id_origine → senat_matricule
 * Ambiguïté / échec → skip (pas de match flou).
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

import { eq, isNotNull } from "drizzle-orm";

import { db, schema } from "../../db";
import { CACHE_DIR, logImport } from "./lib";

const HATVP_CSV_URL =
  "https://www.hatvp.fr/livraison/opendata/liste.csv";
const HATVP_BASE = "https://www.hatvp.fr";

const { acteurHatvp, acteurs } = schema;

type HatvpRow = {
  prenom: string;
  nom: string;
  typeMandat: string;
  qualite: string;
  urlDossier: string;
  idOrigine: string;
};

type Link = {
  acteurUid: string;
  hatvpUrl: string;
  qualite: string;
  matchedOn: string;
};

function parseCsv(text: string): HatvpRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0]!.split(";");
  const idx = (name: string): number => header.indexOf(name);

  const iPrenom = idx("prenom");
  const iNom = idx("nom");
  const iType = idx("type_mandat");
  const iQualite = idx("qualite");
  const iUrl = idx("url_dossier");
  const iId = idx("id_origine");

  const out: HatvpRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(";");
    const typeMandat = (cols[iType] ?? "").trim().toLowerCase();
    if (typeMandat !== "depute" && typeMandat !== "senateur") {
      continue;
    }
    const urlDossier = (cols[iUrl] ?? "").trim();
    if (!urlDossier) continue;
    out.push({
      prenom: (cols[iPrenom] ?? "").trim(),
      nom: (cols[iNom] ?? "").trim(),
      typeMandat,
      qualite: (cols[iQualite] ?? "").trim(),
      urlDossier,
      idOrigine: (cols[iId] ?? "").trim(),
    });
  }
  return out;
}

function toHatvpUrl(urlDossier: string): string {
  if (urlDossier.startsWith("http")) return urlDossier;
  const pathPart = urlDossier.startsWith("/")
    ? urlDossier
    : `/${urlDossier}`;
  return `${HATVP_BASE}${pathPart}`;
}

async function downloadCsv(): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const dest = path.join(CACHE_DIR, "hatvp-liste.csv");
  console.log(`[download] ${HATVP_CSV_URL}`);
  const res = await fetch(HATVP_CSV_URL);
  if (!res.ok) {
    throw new Error(`HATVP CSV HTTP ${res.status}`);
  }
  const text = await res.text();
  await writeFile(dest, text, "utf8");
  console.log(`[download] ${dest} (${text.length} octets)`);
  return dest;
}

export async function ingestHatvp(): Promise<void> {
  const started = Date.now();
  const csvPath = await downloadCsv();
  const text = await readFile(csvPath, "utf8");
  const rows = parseCsv(text);

  // Une fiche nominative par personne (plusieurs docs di/dsp…).
  const byKey = new Map<string, HatvpRow>();
  for (const row of rows) {
    const key = `${row.typeMandat}|${row.idOrigine || row.urlDossier}`;
    if (!byKey.has(key)) byKey.set(key, row);
  }

  const allActeurs = await db
    .select({ uid: acteurs.uid })
    .from(acteurs);
  const byUid = new Set(allActeurs.map((a) => a.uid));

  const senateurs = await db
    .select({
      uid: acteurs.uid,
      senatMatricule: acteurs.senatMatricule,
    })
    .from(acteurs)
    .where(isNotNull(acteurs.senatMatricule));

  const byMatricule = new Map(
    senateurs
      .filter((s) => s.senatMatricule)
      .map((s) => [s.senatMatricule!.toUpperCase(), s.uid]),
  );

  const linksByActeur = new Map<string, Link>();
  let skippedNoId = 0;
  let skippedUnknown = 0;

  for (const row of byKey.values()) {
    const hatvpUrl = toHatvpUrl(row.urlDossier);
    let acteurUid: string | null = null;
    let matchedOn = "";

    if (row.typeMandat === "depute") {
      if (!row.idOrigine) {
        skippedNoId += 1;
        continue;
      }
      const uid = `PA${row.idOrigine}`;
      if (!byUid.has(uid)) {
        skippedUnknown += 1;
        continue;
      }
      acteurUid = uid;
      matchedOn = "id_origine→PA";
    } else {
      if (!row.idOrigine) {
        skippedNoId += 1;
        continue;
      }
      const uid = byMatricule.get(row.idOrigine.toUpperCase());
      if (!uid) {
        skippedUnknown += 1;
        continue;
      }
      acteurUid = uid;
      matchedOn = "id_origine→senat_matricule";
    }

    if (!linksByActeur.has(acteurUid)) {
      linksByActeur.set(acteurUid, {
        acteurUid,
        hatvpUrl,
        qualite: row.qualite || (
          row.typeMandat === "depute" ? "Député" : "Sénateur"
        ),
        matchedOn,
      });
    }
  }

  const links = [...linksByActeur.values()];
  await db.delete(acteurHatvp);
  for (let i = 0; i < links.length; i += 200) {
    await db.insert(acteurHatvp).values(links.slice(i, i + 200));
  }

  await logImport(
    "hatvp_liste",
    HATVP_CSV_URL,
    links.length,
    Date.now() - started,
  );

  console.log(
    `[hatvp] liés=${links.length} skip_no_id=${skippedNoId} ` +
      `skip_unknown=${skippedUnknown}`,
  );

  const [sample] = await db
    .select()
    .from(acteurHatvp)
    .where(eq(acteurHatvp.acteurUid, "PA841729"))
    .limit(1);
  console.log("[hatvp] sample PA841729", sample ?? "(absent)");
}

async function main(): Promise<void> {
  await ingestHatvp();
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
