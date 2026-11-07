/** Persistance locale du questionnaire Boussole (v2). */

import {
  DILEMMES,
  computeProfil,
  type ProfilBoussole,
} from "@/lib/dilemmes";

export const BOUSSOLE_STORAGE_KEY = "phronesis.boussole.v2";
export const ENGAGEMENT_STORAGE_KEY = "phronesis.engagement.v1";

export type BoussoleStored = {
  reponses: Record<string, string>;
};

export type EngagementStored = {
  lastVisit: string;
  streakDays: number;
};

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayDiff(a: string, b: string): number {
  const ta = new Date(`${a}T12:00:00`).getTime();
  const tb = new Date(`${b}T12:00:00`).getTime();
  return Math.round((tb - ta) / 86_400_000);
}

export function loadEngagement(): EngagementStored {
  if (typeof window === "undefined") {
    return { lastVisit: "", streakDays: 0 };
  }
  try {
    const raw = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    if (!raw) return { lastVisit: "", streakDays: 0 };
    return JSON.parse(raw) as EngagementStored;
  } catch {
    return { lastVisit: "", streakDays: 0 };
  }
}

/** Met à jour le streak Boussole (visite / interaction jour J). */
export function touchBoussoleStreak(): EngagementStored {
  const today = todayIsoLocal();
  const prev = loadEngagement();
  let streakDays = prev.streakDays || 0;
  if (prev.lastVisit === today) {
    return prev;
  }
  if (prev.lastVisit && dayDiff(prev.lastVisit, today) === 1) {
    streakDays += 1;
  } else {
    streakDays = 1;
  }
  const next = { lastVisit: today, streakDays };
  localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function loadBoussoleStored(): BoussoleStored {
  if (typeof window === "undefined") return { reponses: {} };
  try {
    const raw = localStorage.getItem(BOUSSOLE_STORAGE_KEY);
    if (!raw) return { reponses: {} };
    return JSON.parse(raw) as BoussoleStored;
  } catch {
    return { reponses: {} };
  }
}

export function saveBoussoleStored(data: BoussoleStored): void {
  localStorage.setItem(BOUSSOLE_STORAGE_KEY, JSON.stringify(data));
}

/** Nombre de dilemmes actuels répondus dans le stockage local. */
export function nombreDilemmesRepondus(): number {
  const reponses = loadBoussoleStored().reponses;
  return DILEMMES.filter((d) =>
    d.choix.some((c) => c.id === reponses[d.id]),
  ).length;
}

/** Profil Boussole si tous les dilemmes sont répondus. */
export function profilFromReponses(
  reponses: Record<string, string>,
): ProfilBoussole | null {
  const valid: Record<string, string> = {};
  for (const d of DILEMMES) {
    const choixId = reponses[d.id];
    if (choixId && d.choix.some((c) => c.id === choixId)) {
      valid[d.id] = choixId;
    }
  }
  if (!DILEMMES.every((d) => valid[d.id])) {
    return null;
  }
  return computeProfil(valid);
}

/**
 * Charge le profil : localStorage d'abord, puis sync cloud si besoin.
 */
export async function loadBoussoleProfil(opts?: {
  syncCloud?: boolean;
}): Promise<ProfilBoussole | null> {
  const local = profilFromReponses(loadBoussoleStored().reponses);
  if (local) return local;
  if (!opts?.syncCloud) return null;
  try {
    const { reponses } = await syncBoussoleAfterAuth();
    return profilFromReponses(reponses);
  } catch {
    return null;
  }
}

function isNonEmpty(
  reponses: Record<string, string>,
): boolean {
  return Object.keys(reponses).length > 0;
}

export type EtatBoussoleCompte = {
  reponses: Record<string, string>;
  /** Date ISO du consentement à l'enregistrement sur le compte, ou null. */
  consentement: string | null;
};

/**
 * Sync post-auth. Sans consentement, rien ne part sur le compte : les
 * réponses restent sur l'appareil. Avec consentement, le compte gagne
 * s'il n'est pas vide, sinon les réponses locales y sont envoyées.
 */
export async function syncBoussoleAfterAuth(): Promise<EtatBoussoleCompte> {
  const local = loadBoussoleStored().reponses;
  let cloud: Record<string, string> = {};
  let consentement: string | null = null;

  try {
    const res = await fetch("/api/me/boussole");
    if (res.ok) {
      const data = (await res.json()) as {
        reponses?: Record<string, string>;
        engagement?: EngagementStored | null;
        consentement?: string | null;
      };
      cloud =
        data.reponses && typeof data.reponses === "object"
          ? data.reponses
          : {};
      consentement = data.consentement ?? null;
      if (data.engagement?.lastVisit) {
        const localEng = loadEngagement();
        if (
          !localEng.lastVisit ||
          data.engagement.lastVisit > localEng.lastVisit
        ) {
          localStorage.setItem(
            ENGAGEMENT_STORAGE_KEY,
            JSON.stringify({
              lastVisit: data.engagement.lastVisit,
              streakDays: data.engagement.streakDays ?? 0,
            }),
          );
        }
      }
    } else {
      return { reponses: local, consentement: null };
    }
  } catch {
    return { reponses: local, consentement: null };
  }

  if (!consentement) return { reponses: local, consentement: null };

  if (isNonEmpty(cloud)) {
    saveBoussoleStored({ reponses: cloud });
    return { reponses: cloud, consentement };
  }
  if (isNonEmpty(local)) {
    await pushBoussoleToCloud(local);
  }
  return { reponses: local, consentement };
}

/**
 * Enregistre les réponses sur le compte. Le serveur refuse (403) tant
 * que l'utilisateur n'a pas donné son accord ; `consentement: true`
 * l'enregistre en même temps.
 */
export async function pushBoussoleToCloud(
  reponses: Record<string, string>,
  opts?: { consentement?: boolean },
): Promise<string | null> {
  try {
    const res = await fetch("/api/me/boussole", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reponses,
        engagement: loadEngagement(),
        ...(opts?.consentement ? { consentement: true } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { consentement?: string | null };
    return data.consentement ?? null;
  } catch {
    /* ignore network errors — local already saved */
    return null;
  }
}

/** Retire l'accord : les réponses sont effacées du compte. */
export async function retirerConsentementBoussole(): Promise<boolean> {
  try {
    const res = await fetch("/api/me/boussole", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reponses: {}, retraitConsentement: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
