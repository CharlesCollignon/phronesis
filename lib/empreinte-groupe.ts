/**
 * Empreinte / vecteur de valeurs agrégé au niveau groupe
 * (majorités pour/contre sur dossiers avec empreinte).
 */

import { eq, inArray, sql } from "drizzle-orm";

import { db, schema } from "@/db";
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
 * Calcule le vecteur agrégé d'un groupe à partir des majorités
 * pour/contre sur dossiers pourvus d'une empreinte.
 */
export async function getEmpreinteGroupe(
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

  const majorites = await db.execute<{
    scrutin_uid: string;
    dossier_uid: string;
    maj: string;
  }>(sql`
    WITH counts AS (
      SELECT
        v.scrutin_uid,
        s.dossier_uid,
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
      GROUP BY v.scrutin_uid, s.dossier_uid
    )
    SELECT
      scrutin_uid,
      dossier_uid,
      CASE
        WHEN pour > contre THEN 'pour'
        WHEN contre > pour THEN 'contre'
      END AS maj
    FROM counts
    WHERE pour <> contre
      AND EXISTS (
        SELECT 1 FROM empreintes e
        WHERE e.dossier_uid = counts.dossier_uid
      )
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
