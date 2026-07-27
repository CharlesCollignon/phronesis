/**
 * Ingestion Sénat : matricules ODSEN + scrutins/votes Dosleg.
 * Sources officielles data.senat.fr (licence ouverte).
 */
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { sql } from "drizzle-orm";
import yauzl from "yauzl";

import { db } from "../../db";
import { acteurs, scrutins, votes } from "../../db/schema";
import { CACHE_DIR, inBatches, logImport } from "./lib";

const ODSEN_URL =
  "https://data.senat.fr/data/senateurs/ODSEN_GENERAL.json";
const DOSLEG_URL = "https://data.senat.fr/data/dosleg/dosleg.zip";

const POS_MAP: Record<string, string> = {
  "1": "pour",
  "2": "contre",
  "3": "abstention",
  "4": "nonVotant",
};

type OdsenRow = {
  Matricule: string;
  Nom_usuel: string;
  Prenom_usuel: string;
  Etat?: string;
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

async function downloadFile(
  url: string,
  destName: string,
): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const dest = path.join(CACHE_DIR, destName);
  const existing = await stat(dest).catch(() => null);
  if (existing && existing.size > 0) {
    console.log(`[cache] ${destName}`);
    return dest;
  }
  console.log(`[download] ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Téléchargement échoué (${res.status}) ${url}`);
  }
  await pipeline(
    Readable.fromWeb(res.body as import("stream/web").ReadableStream),
    createWriteStream(dest),
  );
  return dest;
}

async function mapMatricules(): Promise<Map<string, string>> {
  const jsonPath = await downloadFile(ODSEN_URL, "ODSEN_GENERAL.json");
  const raw = JSON.parse(await readFile(jsonPath, "utf-8")) as {
    results: OdsenRow[];
  };
  const byKey = new Map<string, string[]>();
  for (const row of raw.results) {
    const mat = (row.Matricule ?? "").trim();
    const prenom = row.Prenom_usuel ?? "";
    const nom = row.Nom_usuel ?? "";
    if (!mat || !prenom || !nom) continue;
    const key = `${normalizeName(prenom)}|${normalizeName(nom)}`;
    const list = byKey.get(key) ?? [];
    list.push(mat);
    byKey.set(key, list);
  }

  // Tous les acteurs AMO (sénateurs actuels et anciens inclus).
  const allActeurs = await db.execute<{
    uid: string;
    prenom: string;
    nom: string;
  }>(sql`SELECT uid, prenom, nom FROM acteurs`);

  const matToUid = new Map<string, string>();
  let matched = 0;
  for (const s of allActeurs) {
    const key = `${normalizeName(s.prenom)}|${normalizeName(s.nom)}`;
    const mats = byKey.get(key);
    if (!mats || mats.length === 0) continue;
    const mat = mats[0]!;
    if (matToUid.has(mat)) continue;
    matToUid.set(mat, s.uid);
    matched++;
  }

  console.log(
    `Matricules liés : ${matched} acteurs AMO ` +
      `(sur ${raw.results.length} ODSEN)`,
  );

  const updates = [...matToUid.entries()].map(([mat, uid]) => ({
    uid,
    senatMatricule: mat,
  }));
  await inBatches(updates, 200, async (batch) => {
    for (const row of batch) {
      await db
        .update(acteurs)
        .set({ senatMatricule: row.senatMatricule })
        .where(sql`${acteurs.uid} = ${row.uid}`);
    }
  });

  return matToUid;
}

function extractCopy(sqlText: string, table: string): string {
  const marker = `COPY ${table} `;
  const i = sqlText.indexOf(marker);
  if (i < 0) throw new Error(`COPY ${table} introuvable`);
  const j = sqlText.indexOf("FROM stdin;\n", i);
  const start = j + "FROM stdin;\n".length;
  const end = sqlText.indexOf("\n\\.\n", start);
  return sqlText.slice(start, end);
}

async function readDoslegSql(): Promise<string> {
  const zipPath = await downloadFile(DOSLEG_URL, "dosleg.zip");
  // Cache extracted sql for faster re-runs.
  const sqlPath = path.join(CACHE_DIR, "dosleg.sql");
  const existing = await stat(sqlPath).catch(() => null);
  if (existing && existing.size > 0) {
    console.log("[cache] dosleg.sql");
    return readFile(sqlPath, "latin1");
  }
  console.log("[extract] dosleg.sql…");
  await new Promise<void>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err);
      zip.on("entry", (entry) => {
        if (!entry.fileName.endsWith(".sql")) {
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, async (e2, stream) => {
          if (e2) return reject(e2);
          const chunks: Buffer[] = [];
          stream.on("data", (c: Buffer) => chunks.push(c));
          stream.on("error", reject);
          stream.on("end", async () => {
            await writeFile(sqlPath, Buffer.concat(chunks));
            resolve();
          });
        });
      });
      zip.readEntry();
    });
  });
  return readFile(sqlPath, "latin1");
}

function sqlExcluded(column: string): ReturnType<typeof sql> {
  return sql.raw(`excluded."${column}"`);
}

async function ingestScrutinsAndVotes(
  matToUid: Map<string, string>,
): Promise<void> {
  const sqlText = await readDoslegSql();
  const scrBlock = extractCopy(sqlText, "scr");
  const votBlock = extractCopy(sqlText, "votsen");

  type ScrutinRow = typeof scrutins.$inferInsert;
  const scrutinRows: ScrutinRow[] = [];
  for (const line of scrBlock.split("\n")) {
    if (!line) continue;
    const cols = line.split("\t");
    // sesann scrnum code scrint scrdat scrpou scrcon scrvot scrsuf …
    const sesann = parseInt(cols[0] ?? "", 10);
    const scrnum = parseInt(cols[1] ?? "", 10);
    const titre = (cols[3] ?? "").replace(/\u00c2/g, "").trim();
    const dateRaw = cols[4] ?? "";
    const dateScrutin = dateRaw.slice(0, 10);
    const pour = parseInt(cols[5] ?? "0", 10) || 0;
    const contre = parseInt(cols[6] ?? "0", 10) || 0;
    const nombreVotants = parseInt(cols[7] ?? "0", 10) || 0;
    const suffragesExprimes = parseInt(cols[8] ?? "0", 10) || 0;
    if (!sesann || !scrnum || !dateScrutin || !titre) continue;
    const uid = `VTSEN${sesann}N${scrnum}`;
    scrutinRows.push({
      uid,
      chambre: "SENAT",
      numero: scrnum,
      legislature: sesann,
      dateScrutin,
      titre,
      sortCode: pour >= contre ? "adopte" : "rejete",
      nombreVotants,
      suffragesExprimes,
      pour,
      contre,
      abstentions: 0,
      nonVotants: 0,
    });
  }
  console.log(`Scrutins Sénat parsés : ${scrutinRows.length}`);
  const scrutinUids = new Set(scrutinRows.map((s) => s.uid));

  await inBatches(scrutinRows, 300, async (batch) => {
    await db
      .insert(scrutins)
      .values(batch)
      .onConflictDoUpdate({
        target: scrutins.uid,
        set: {
          titre: sqlExcluded("titre"),
          sortCode: sqlExcluded("sort_code"),
          pour: sqlExcluded("pour"),
          contre: sqlExcluded("contre"),
          nombreVotants: sqlExcluded("nombre_votants"),
          suffragesExprimes: sqlExcluded("suffrages_exprimes"),
        },
      });
  });

  // Précharge groupes Sénat courants (acteur -> organe GROUPESENAT).
  const groupeRows = await db.execute<{
    acteur_uid: string;
    organe_uid: string;
  }>(sql`
    SELECT DISTINCT ON (m.acteur_uid)
      m.acteur_uid, m.organe_uid
    FROM mandats m
    WHERE m.code_type_organe = 'GROUPESENAT'
      AND m.date_fin IS NULL
      AND m.organe_uid IS NOT NULL
    ORDER BY m.acteur_uid, m.date_debut DESC NULLS LAST
  `);
  const groupeByActeur = new Map(
    groupeRows.map((r) => [r.acteur_uid, r.organe_uid]),
  );

  type VoteRow = typeof votes.$inferInsert;
  let buffer: VoteRow[] = [];
  let parsed = 0;
  let skipped = 0;
  const flush = async (): Promise<void> => {
    if (buffer.length === 0) return;
    const batch = buffer;
    buffer = [];
    await db
      .insert(votes)
      .values(batch)
      .onConflictDoUpdate({
        target: [votes.scrutinUid, votes.acteurUid],
        set: {
          position: sqlExcluded("position"),
          groupeUid: sqlExcluded("groupe_uid"),
          parDelegation: sqlExcluded("par_delegation"),
        },
      });
  };

  for (const line of votBlock.split("\n")) {
    if (!line) continue;
    const cols = line.split("\t");
    const sesann = cols[0];
    const scrnum = cols[1];
    const senmat = (cols[2] ?? "").trim();
    const posCod = (cols[3] ?? "").trim();
    const del = cols[6] && cols[6] !== "\\N";
    const acteurUid = matToUid.get(senmat);
    if (!acteurUid) {
      skipped++;
      continue;
    }
    const position = POS_MAP[posCod];
    if (!position) {
      skipped++;
      continue;
    }
    const scrutinUid = `VTSEN${sesann}N${scrnum}`;
    if (!scrutinUids.has(scrutinUid)) {
      skipped++;
      continue;
    }
    buffer.push({
      scrutinUid,
      acteurUid,
      groupeUid: groupeByActeur.get(acteurUid) ?? null,
      position,
      parDelegation: Boolean(del),
    });

    parsed++;
    if (buffer.length >= 3000) await flush();
    if (parsed % 200000 === 0) {
      console.log(`  … ${parsed} votes Sénat`);
    }
  }
  await flush();
  console.log(
    `Votes Sénat : ${parsed} importés, ${skipped} ignorés ` +
      `(matricule inconnu)`,
  );

  // Agrégats abstention / non-votant depuis les votes importés.
  await db.execute(sql`
    UPDATE scrutins s
    SET
      abstentions = c.abst,
      non_votants = c.nv
    FROM (
      SELECT
        scrutin_uid,
        count(*) FILTER (WHERE position = 'abstention')::int AS abst,
        count(*) FILTER (WHERE position = 'nonVotant')::int AS nv
      FROM votes
      WHERE scrutin_uid LIKE 'VTSEN%'
      GROUP BY scrutin_uid
    ) c
    WHERE s.uid = c.scrutin_uid AND s.chambre = 'SENAT'
  `);
}

async function main(): Promise<void> {
  const start = Date.now();
  const matToUid = await mapMatricules();
  await ingestScrutinsAndVotes(matToUid);
  const duration = Date.now() - start;
  await logImport("senat", DOSLEG_URL, matToUid.size, duration);
  console.log(`Import Sénat terminé en ${Math.round(duration / 1000)}s`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
