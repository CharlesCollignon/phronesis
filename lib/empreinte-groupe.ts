/**
 * Empreinte / vecteur de valeurs agrégé au niveau groupe
 * (majorités pour/contre sur dossiers avec empreinte).
 */

import { eq, inArray, sql, type SQL } from "drizzle-orm";

import { db, schema } from "@/db";
import { cachedQuery } from "@/lib/cache";
import {
  AXES_BOUSSOLE,
  type AxeBoussole,
  type ProfilBoussole,
} from "@/lib/dilemmes";
import { rankPhilosophies, type PhilosophieRef } from "@/lib/philosophies";
import {
  projetEmpreinteVersBoussole,
  type EmpreinteImpactRow,
} from "@/lib/resonance";

const { empreintes, organes } = schema;

export type GroupeEmpreinteAgregat = {
  groupe: {
    uid: string;
    libelle: string;
    libelleAbrege: string | null;
    couleur: string | null;
    codeType: string | null;
  };
  profil: ProfilBoussole;
  axesUtilises: AxeBoussole[];
  scrutinsMobilises: number;
  dossiersMobilises: number;
  rankingPhilosophies: {
    philo: PhilosophieRef;
    score: number;
  }[];
  /** Lignes synthétiques pour ResonancePanel (axe + impact). */
  empreinteSynthetique: EmpreinteImpactRow[];
};

function impactFromValue(v: number): string {
  if (v > 0.25) return "renforce";
  if (v < -0.25) return "restreint";
  return "mitige";
}

/** Inverse mapping Boussole → un axe Empreinte « canonique ». */
const BOUSSOLE_VERS_EMPREINTE_LABEL: Partial<
  Record<AxeBoussole, string>
> = {
  liberte: "liberte",
  egalite: "egalite",
  solidarite: "solidarite",
  vie_privee: "vie_privee",
  responsabilite: "responsabilite_individuelle",
  ecologie: "durabilite",
  marche: "efficacite_economique",
  autorite: "securite",
};

function emptyProfil(): ProfilBoussole {
  const p = {} as ProfilBoussole;
  for (const axe of AXES_BOUSSOLE) p[axe] = 0;
  return p;
}

/**
 * Condition SQL : le scrutin porte sur le texte lui-même, de sorte
 * que voter « pour » revient à soutenir le texte. Retient le vote sur
 * l'ensemble, l'article unique, le texte entier (« le projet de loi… »)
 * et les parties d'une loi de finances.
 *
 * Exclut :
 * - les motions de censure, qui portent sur la confiance au
 *   gouvernement et non sur le contenu du texte ;
 * - les motions de rejet ou de renvoi, souvent tactiques : la majorité
 *   vote parfois le rejet de son propre texte pour l'envoyer
 *   directement en commission mixte paritaire.
 */
export function estVoteSurLeTexte(titre: SQL): SQL {
  return sql`(
    ${titre} ~* '^l[’'']ensemble '
    OR ${titre} ~* '^l[’'']article unique '
    OR ${titre} ~* '^(le projet|la proposition) de (loi|résolution)'
    OR ${titre} ~* '^la (première|deuxième|seconde) partie du projet de loi'
  )`;
}

/**
 * Calcule le vecteur agrégé d'un groupe à partir de sa majorité
 * pour/contre sur les votes portant sur l'ensemble des textes pourvus
 * d'une empreinte. Un dossier voté plusieurs fois (première lecture,
 * texte de CMP, lecture définitive) ne compte qu'une fois, avec le
 * dernier vote où le groupe a tranché.
 */
async function getEmpreinteGroupeUncached(
  organeUid: string,
): Promise<GroupeEmpreinteAgregat | null> {
  const [groupe] = await db
    .select({
      uid: organes.uid,
      libelle: organes.libelle,
      libelleAbrege: organes.libelleAbrege,
      couleur: organes.couleur,
      codeType: organes.codeType,
    })
    .from(organes)
    .where(eq(organes.uid, organeUid))
    .limit(1);
  if (!groupe) return null;

  // Du plus récent au plus ancien, pour garder le dernier vote de
  // chaque dossier.
  const majorites = await db.execute<{
    scrutin_uid: string;
    dossier_uid: string;
    maj: string;
  }>(sql`
    WITH counts AS (
      SELECT
        s.uid AS scrutin_uid,
        s.dossier_uid,
        s.date_scrutin,
        s.numero,
        count(*) FILTER (
          WHERE v.position = 'pour'
        )::int AS pour,
        count(*) FILTER (
          WHERE v.position = 'contre'
        )::int AS contre
      FROM votes v
      INNER JOIN scrutins s ON s.uid = v.scrutin_uid
      WHERE v.groupe_uid = ${organeUid}
        AND v.position IN ('pour', 'contre')
        AND s.dossier_uid IS NOT NULL
        AND ${estVoteSurLeTexte(sql`s.titre`)}
        AND EXISTS (
          SELECT 1 FROM empreintes e
          WHERE e.dossier_uid = s.dossier_uid
        )
      GROUP BY s.uid, s.dossier_uid, s.date_scrutin, s.numero
    )
    SELECT
      scrutin_uid,
      dossier_uid,
      CASE WHEN pour > contre THEN 'pour' ELSE 'contre' END AS maj
    FROM counts
    WHERE pour <> contre
    ORDER BY date_scrutin DESC, numero DESC
  `);

  const rows = Array.from(majorites);
  if (rows.length === 0) {
    const empty = emptyProfil();
    return {
      groupe,
      profil: empty,
      axesUtilises: [],
      scrutinsMobilises: 0,
      dossiersMobilises: 0,
      rankingPhilosophies: rankPhilosophies(empty),
      empreinteSynthetique: [],
    };
  }

  const dossierUids = [
    ...new Set(rows.map((r) => r.dossier_uid)),
  ];
  const empRows = await db
    .select({
      dossierUid: empreintes.dossierUid,
      axe: empreintes.axe,
      impact: empreintes.impact,
    })
    .from(empreintes)
    .where(inArray(empreintes.dossierUid, dossierUids));

  const byDossier = new Map<string, EmpreinteImpactRow[]>();
  for (const e of empRows) {
    const list = byDossier.get(e.dossierUid) ?? [];
    list.push({ axe: e.axe, impact: e.impact });
    byDossier.set(e.dossierUid, list);
  }

  const sums = {} as Record<AxeBoussole, number>;
  const counts = {} as Record<AxeBoussole, number>;
  for (const axe of AXES_BOUSSOLE) {
    sums[axe] = 0;
    counts[axe] = 0;
  }

  const dossiersVus = new Set<string>();
  for (const row of rows) {
    // Lignes triées du plus récent au plus ancien : seul le dernier
    // vote tranché de chaque dossier compte.
    if (dossiersVus.has(row.dossier_uid)) continue;
    const emp = byDossier.get(row.dossier_uid);
    if (!emp) continue;
    dossiersVus.add(row.dossier_uid);
    const sign = row.maj === "pour" ? 1 : -1;
    const { profil, axesUtilises } =
      projetEmpreinteVersBoussole(emp);
    for (const axe of axesUtilises) {
      sums[axe] += profil[axe] * sign;
      counts[axe] += 1;
    }
  }

  const profil = {} as ProfilBoussole;
  const axesUtilises: AxeBoussole[] = [];
  for (const axe of AXES_BOUSSOLE) {
    if (counts[axe] === 0) {
      profil[axe] = 0;
    } else {
      profil[axe] = Math.max(
        -1,
        Math.min(1, sums[axe] / counts[axe]),
      );
      axesUtilises.push(axe);
    }
  }

  const empreinteSynthetique: EmpreinteImpactRow[] = axesUtilises
    .map((axe) => {
      const empAxe = BOUSSOLE_VERS_EMPREINTE_LABEL[axe];
      if (!empAxe) return null;
      return {
        axe: empAxe,
        impact: impactFromValue(profil[axe]),
      };
    })
    .filter((x): x is EmpreinteImpactRow => x != null);

  return {
    groupe,
    profil,
    axesUtilises,
    scrutinsMobilises: rows.length,
    dossiersMobilises: dossiersVus.size,
    rankingPhilosophies: rankPhilosophies(profil),
    empreinteSynthetique,
  };
}

// Agrégat open data mis en cache jusqu'à la prochaine ingestion (voir
// lib/cache.ts). Le suffixe de clé change avec la méthode de calcul :
// le cache Vercel survit aux déploiements.
export const getEmpreinteGroupe = cachedQuery(
  "getEmpreinteGroupe:vote-sur-le-texte",
  getEmpreinteGroupeUncached,
);
