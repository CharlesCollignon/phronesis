import { sql } from "drizzle-orm";

import { db } from "../../db";
import { acteurs, organes, scrutins, votes } from "../../db/schema";
import {
  DATASETS,
  asArray,
  asDate,
  asInt,
  asText,
  download,
  forEachZipEntry,
  inBatches,
  logImport,
} from "./lib";

type Json = Record<string, unknown>;

type ScrutinRow = typeof scrutins.$inferInsert;
type VoteRow = typeof votes.$inferInsert;

const POSITIONS = [
  ["pours", "pour"],
  ["contres", "contre"],
  ["abstentions", "abstention"],
  ["nonVotants", "nonVotant"],
] as const;

function parseScrutin(
  raw: Json,
): { scrutin: ScrutinRow; votes: VoteRow[] } | null {
  const s = raw.scrutin as Json | undefined;
  if (!s) return null;
  const uid = asText(s.uid);
  const numero = asInt(s.numero);
  const legislature = asInt(s.legislature);
  const dateScrutin = asDate(s.dateScrutin);
  const titre = asText(s.titre);
  const sort = (s.sort ?? {}) as Json;
  const sortCode = asText(sort.code);
  if (!uid || numero == null || !legislature || !dateScrutin || !titre) {
    return null;
  }
  const typeVote = (s.typeVote ?? {}) as Json;
  const demandeur = (s.demandeur ?? {}) as Json;
  const synthese = (s.syntheseVote ?? {}) as Json;
  const decompte = (synthese.decompte ?? {}) as Json;

  const scrutin: ScrutinRow = {
    uid,
    numero,
    legislature,
    dateScrutin,
    titre,
    typeVoteCode: asText(typeVote.codeTypeVote),
    typeVoteLibelle: asText(typeVote.libelleTypeVote),
    sortCode: sortCode ?? "inconnu",
    demandeur: asText(demandeur.texte),
    seanceRef: asText(s.seanceRef),
    nombreVotants: asInt(synthese.nombreVotants),
    suffragesExprimes: asInt(synthese.suffragesExprimes),
    suffragesRequis: asInt(synthese.nbrSuffragesRequis),
    pour: asInt(decompte.pour),
    contre: asInt(decompte.contre),
    abstentions: asInt(decompte.abstentions),
    nonVotants: asInt(decompte.nonVotants),
  };

  const voteRows: VoteRow[] = [];
  const ventilation = (s.ventilationVotes ?? {}) as Json;
  const organe = (ventilation.organe ?? {}) as Json;
  const groupes = asArray(((organe.groupes ?? {}) as Json).groupe) as Json[];
  for (const groupe of groupes) {
    const groupeUid = asText(groupe.organeRef);
    const vote = (groupe.vote ?? {}) as Json;
    const nominatif = (vote.decompteNominatif ?? {}) as Json;
    for (const [key, position] of POSITIONS) {
      const bloc = nominatif[key];
      if (bloc == null) continue;
      const votants = asArray((bloc as Json).votant) as Json[];
      for (const votant of votants) {
        const acteurUid = asText(votant.acteurRef);
        if (!acteurUid) continue;
        voteRows.push({
          scrutinUid: uid,
          acteurUid,
          groupeUid,
          position,
          parDelegation: asText(votant.parDelegation) === "true",
          causePosition: asText(votant.causePositionVote),
        });
      }
    }
  }
  return { scrutin, votes: voteRows };
}

function sqlExcluded(column: string): ReturnType<typeof sql> {
  return sql.raw(`excluded."${column}"`);
}

async function main(): Promise<void> {
  const start = Date.now();
  const zipPath = await download(DATASETS.scrutins);

  const scrutinRows: ScrutinRow[] = [];
  const voteRows: VoteRow[] = [];

  await forEachZipEntry(
    zipPath,
    (p) => p.endsWith(".json"),
    (_p, content) => {
      const parsed = parseScrutin(JSON.parse(content) as Json);
      if (parsed) {
        scrutinRows.push(parsed.scrutin);
        voteRows.push(...parsed.votes);
      }
    },
  );

  console.log(
    `Parsé : ${scrutinRows.length} scrutins, ${voteRows.length} votes`,
  );

  // Sécurité FK : ignore les votes d'acteurs absents du référentiel AMO.
  const acteurUids = new Set(
    (await db.select({ uid: acteurs.uid }).from(acteurs)).map((a) => a.uid),
  );
  const validVotes = voteRows.filter((v) => acteurUids.has(v.acteurUid));
  const skipped = voteRows.length - validVotes.length;
  if (skipped > 0) {
    console.warn(`Attention : ${skipped} votes ignorés (acteur inconnu)`);
  }

  // Sécurité FK : neutralise les groupes absents du référentiel.
  const organeUids = new Set(
    (await db.select({ uid: organes.uid }).from(organes)).map((o) => o.uid),
  );
  let unknownGroups = 0;
  for (const v of validVotes) {
    if (v.groupeUid && !organeUids.has(v.groupeUid)) {
      v.groupeUid = null;
      unknownGroups++;
    }
  }
  if (unknownGroups > 0) {
    console.warn(`Attention : ${unknownGroups} votes sans groupe reconnu`);
  }

  await inBatches(scrutinRows, 200, async (batch) => {
    await db
      .insert(scrutins)
      .values(batch)
      .onConflictDoUpdate({
        target: scrutins.uid,
        set: {
          titre: sqlExcluded("titre"),
          sortCode: sqlExcluded("sort_code"),
          nombreVotants: sqlExcluded("nombre_votants"),
          suffragesExprimes: sqlExcluded("suffrages_exprimes"),
          suffragesRequis: sqlExcluded("suffrages_requis"),
          pour: sqlExcluded("pour"),
          contre: sqlExcluded("contre"),
          abstentions: sqlExcluded("abstentions"),
          nonVotants: sqlExcluded("non_votants"),
        },
      });
  });

  await inBatches(validVotes, 2000, async (batch) => {
    await db
      .insert(votes)
      .values(batch)
      .onConflictDoUpdate({
        target: [votes.scrutinUid, votes.acteurUid],
        set: {
          groupeUid: sqlExcluded("groupe_uid"),
          position: sqlExcluded("position"),
          parDelegation: sqlExcluded("par_delegation"),
          causePosition: sqlExcluded("cause_position"),
        },
      });
  });

  // Lie les scrutins aux dossiers via les vote_refs des actes législatifs.
  const linked = await db.execute(sql`
    UPDATE scrutins s
    SET dossier_uid = a.dossier_uid
    FROM (
      SELECT DISTINCT dossier_uid,
             jsonb_array_elements_text(vote_refs) AS vote_ref
      FROM actes
      WHERE vote_refs IS NOT NULL
    ) a
    WHERE s.uid = a.vote_ref
  `);
  console.log(`Scrutins liés à un dossier : ${linked.count ?? "?"}`);

  const duration = Date.now() - start;
  await logImport(
    "scrutins",
    DATASETS.scrutins.url,
    scrutinRows.length + validVotes.length,
    duration,
  );
  console.log(`Import scrutins terminé en ${Math.round(duration / 1000)}s`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
