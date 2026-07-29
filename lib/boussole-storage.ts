/** Persistance locale du questionnaire Boussole (v2). */

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

function isNonEmpty(
  reponses: Record<string, string>,
): boolean {
  return Object.keys(reponses).length > 0;
}

/**
 * Sync post-auth : cloud gagne si non vide, sinon local → cloud.
 */
export async function syncBoussoleAfterAuth(): Promise<
  Record<string, string>
> {
  const local = loadBoussoleStored().reponses;
  let cloud: Record<string, string> = {};

  try {
    const res = await fetch("/api/me/boussole");
    if (res.ok) {
      const data = (await res.json()) as {
        reponses?: Record<string, string>;
        engagement?: EngagementStored | null;
      };
      cloud =
        data.reponses && typeof data.reponses === "object"
          ? data.reponses
          : {};
      if (data.engagement?.lastVisit) {
        const localEng = loadEngagement();
        if (
          !localEng.lastVisit ||
          data.engagement.lastVisit > localEng.lastVisit
        ) {
          localStorage.setItem(
            ENGAGEMENT_STORAGE_KEY,
            JSON.stringify(data.engagement),
          );
        }
      }
    } else if (res.status === 401 || res.status === 503) {
      return local;
    }
  } catch {
    return local;
  }

  if (isNonEmpty(cloud)) {
    saveBoussoleStored({ reponses: cloud });
    return cloud;
  }

  if (isNonEmpty(local)) {
    try {
      await fetch("/api/me/boussole", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reponses: local,
          engagement: loadEngagement(),
        }),
      });
    } catch {
      /* local remains source of truth offline */
    }
    return local;
  }

  return {};
}

export async function pushBoussoleToCloud(
  reponses: Record<string, string>,
): Promise<void> {
  try {
    await fetch("/api/me/boussole", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reponses,
        engagement: loadEngagement(),
      }),
    });
  } catch {
    /* ignore network errors — local already saved */
  }
}
