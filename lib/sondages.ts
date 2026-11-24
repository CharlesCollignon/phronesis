/**
 * Totaux des consultations citoyennes, lus par les fiches dossier et
 * scrutin.
 *
 * Une seule entrée de cache par type pour tout le site, relue seulement
 * quand un avis est donné ou retiré (`SONDAGES_TAG`) : afficher une
 * fiche n'interroge plus la base. Tant que les consultations restent
 * peu nombreuses, c'est le plus économe ; au-delà de quelques milliers
 * de fiches consultées, passer à une entrée par fiche.
 */
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { cachedQuery, SONDAGES_TAG } from "@/lib/cache";

export type TotauxSondageDossier = {
  pour: number;
  contre: number;
  pasAvis: number;
  total: number;
};

export type TotauxSondageScrutin = {
  pour: number;
  contre: number;
  abstention: number;
  pasAvis: number;
  total: number;
};

type Ligne = { uid: string; position: string; n: number };

async function totauxDossiersUncached(): Promise<
  Record<string, TotauxSondageDossier>
> {
  const rows = await db.execute<Ligne>(sql`
    SELECT dossier_uid AS uid, position, count(*)::int AS n
    FROM sondages_dossiers
    GROUP BY dossier_uid, position
  `);
  const totaux: Record<string, TotauxSondageDossier> = {};
  for (const r of rows) {
    const t = (totaux[r.uid] ??= { pour: 0, contre: 0, pasAvis: 0, total: 0 });
    if (r.position === "pour") t.pour = r.n;
    else if (r.position === "contre") t.contre = r.n;
    else if (r.position === "pas_avis") t.pasAvis = r.n;
    t.total = t.pour + t.contre + t.pasAvis;
  }
  return totaux;
}

async function totauxScrutinsUncached(): Promise<
  Record<string, TotauxSondageScrutin>
> {
  const rows = await db.execute<Ligne>(sql`
    SELECT scrutin_uid AS uid, position, count(*)::int AS n
    FROM sondages_scrutins
    GROUP BY scrutin_uid, position
  `);
  const totaux: Record<string, TotauxSondageScrutin> = {};
  for (const r of rows) {
    const t = (totaux[r.uid] ??= {
      pour: 0,
      contre: 0,
      abstention: 0,
      pasAvis: 0,
      total: 0,
    });
    if (r.position === "pour") t.pour = r.n;
    else if (r.position === "contre") t.contre = r.n;
    else if (r.position === "abstention") t.abstention = r.n;
    else if (r.position === "pas_avis") t.pasAvis = r.n;
    t.total = t.pour + t.contre + t.abstention + t.pasAvis;
  }
  return totaux;
}

const SONDAGES = { tags: [SONDAGES_TAG], revalidate: false as const };

const totauxDossiers = cachedQuery(
  "sondagesDossiers",
  totauxDossiersUncached,
  SONDAGES,
);
const totauxScrutins = cachedQuery(
  "sondagesScrutins",
  totauxScrutinsUncached,
  SONDAGES,
);

export async function getSondageDossier(
  dossierUid: string,
): Promise<TotauxSondageDossier> {
  return (
    (await totauxDossiers())[dossierUid] ?? {
      pour: 0,
      contre: 0,
      pasAvis: 0,
      total: 0,
    }
  );
}

export async function getSondageScrutin(
  scrutinUid: string,
): Promise<TotauxSondageScrutin> {
  return (
    (await totauxScrutins())[scrutinUid] ?? {
      pour: 0,
      contre: 0,
      abstention: 0,
      pasAvis: 0,
      total: 0,
    }
  );
}
