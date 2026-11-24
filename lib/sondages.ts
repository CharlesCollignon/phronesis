/**
 * Totaux des consultations citoyennes, lus par les fiches dossier et
 * scrutin.
 *
 * Deux étages de cache, pour qu'afficher une fiche n'interroge pas la
 * base et qu'un avis ne touche que la fiche concernée :
 *
 * - un agrégat par type pour tout le site (`SONDAGES_TAG`), relu en une
 *   requête quand un avis est donné ou retiré ;
 * - une entrée par fiche, tirée de cet agrégat et portant l'étiquette de
 *   la fiche (`tagSondageDossier`, `tagSondageScrutin`). C'est elle que
 *   lisent les pages : comme elles sont statiques, elles héritent de ses
 *   étiquettes. Si elles lisaient l'agrégat, un seul avis invaliderait
 *   toutes les fiches du site.
 *
 * Une route qui enregistre un avis invalide donc les deux : l'agrégat,
 * et l'entrée de la fiche.
 */
import { sql } from "drizzle-orm";

import { db } from "@/db";
import {
  cachedQuery,
  SONDAGES_TAG,
  tagSondageDossier,
  tagSondageScrutin,
} from "@/lib/cache";
import { estUidFiche } from "@/lib/cache-tags";

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

const AUCUN_AVIS_DOSSIER: TotauxSondageDossier = {
  pour: 0,
  contre: 0,
  pasAvis: 0,
  total: 0,
};

const AUCUN_AVIS_SCRUTIN: TotauxSondageScrutin = {
  pour: 0,
  contre: 0,
  abstention: 0,
  pasAvis: 0,
  total: 0,
};

const sondageDossier = cachedQuery(
  "sondageDossier",
  async (uid: string): Promise<TotauxSondageDossier> =>
    (await totauxDossiers())[uid] ?? AUCUN_AVIS_DOSSIER,
  { tags: (uid) => [tagSondageDossier(uid)], revalidate: false },
);

const sondageScrutin = cachedQuery(
  "sondageScrutin",
  async (uid: string): Promise<TotauxSondageScrutin> =>
    (await totauxScrutins())[uid] ?? AUCUN_AVIS_SCRUTIN,
  { tags: (uid) => [tagSondageScrutin(uid)], revalidate: false },
);

/**
 * Un identifiant mal formé (URL sondée par un robot) ne crée pas
 * d'entrée de cache.
 */
export async function getSondageDossier(
  dossierUid: string,
): Promise<TotauxSondageDossier> {
  if (!estUidFiche(dossierUid)) return AUCUN_AVIS_DOSSIER;
  return sondageDossier(dossierUid);
}

export async function getSondageScrutin(
  scrutinUid: string,
): Promise<TotauxSondageScrutin> {
  if (!estUidFiche(scrutinUid)) return AUCUN_AVIS_SCRUTIN;
  return sondageScrutin(scrutinUid);
}
