/** Persistance locale du questionnaire Boussole (v2). */

export const BOUSSOLE_STORAGE_KEY = "phronesis.boussole.v2";

export type BoussoleStored = {
  reponses: Record<string, string>;
};

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
      };
      cloud =
        data.reponses && typeof data.reponses === "object"
          ? data.reponses
          : {};
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
        body: JSON.stringify({ reponses: local }),
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
      body: JSON.stringify({ reponses }),
    });
  } catch {
    /* ignore network errors — local already saved */
  }
}
