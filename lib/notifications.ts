/**
 * Notifications in-app (Clerk) — génération à la lecture.
 */
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  dossiers,
  empreintes,
  notifications,
  scrutins,
  userProfiles,
  type NotificationType,
} from "@/db/schema";
import { computeProfil, type ProfilBoussole } from "@/lib/dilemmes";
import { computeResonance } from "@/lib/resonance";

const RESONANCE_THRESHOLD = 0.55;
const LOOKBACK_DAYS = 14;
const MAX_GENERATE = 8;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function profilFromUser(
  clerkUserId: string,
): Promise<ProfilBoussole | null> {
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);
  const reponses = row?.boussoleReponses ?? {};
  if (Object.keys(reponses).length === 0) return null;
  try {
    return computeProfil(reponses);
  } catch {
    return null;
  }
}

async function insertOnce(opts: {
  clerkUserId: string;
  type: NotificationType;
  titre: string;
  body: string;
  href: string;
  targetUid: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db
    .insert(notifications)
    .values({
      clerkUserId: opts.clerkUserId,
      type: opts.type,
      titre: opts.titre,
      body: opts.body,
      href: opts.href,
      targetUid: opts.targetUid,
      payload: opts.payload ?? {},
    })
    .onConflictDoNothing();
}

/** Crée des notifs manquantes pour l'utilisateur (idempotent). */
export async function ensureNotificationsForUser(
  clerkUserId: string,
): Promise<void> {
  const since = daysAgoIso(LOOKBACK_DAYS);

  const recentScrutins = await db
    .select({
      uid: scrutins.uid,
      titre: scrutins.titre,
      numero: scrutins.numero,
      dateScrutin: scrutins.dateScrutin,
    })
    .from(scrutins)
    .where(gte(scrutins.dateScrutin, since))
    .orderBy(desc(scrutins.dateScrutin))
    .limit(MAX_GENERATE);

  for (const s of recentScrutins) {
    await insertOnce({
      clerkUserId,
      type: "nouveau_scrutin",
      titre: `Nouveau scrutin n° ${s.numero}`,
      body: s.titre.slice(0, 180),
      href: `/scrutins/${s.uid}`,
      targetUid: s.uid,
      payload: { dateScrutin: s.dateScrutin },
    });
  }

  const recentWithEmpreinte = await db.execute<{
    uid: string;
    titre: string;
  }>(sql`
    SELECT d.uid, d.titre
    FROM dossiers d
    WHERE d.legislature = 17
      AND EXISTS (
        SELECT 1 FROM empreintes e
        WHERE e.dossier_uid = d.uid
          AND e.genere_le >= ${since}::timestamptz
      )
    ORDER BY d.uid DESC
    LIMIT ${MAX_GENERATE}
  `);

  for (const d of recentWithEmpreinte as { uid: string; titre: string }[]) {
    await insertOnce({
      clerkUserId,
      type: "nouveau_dossier",
      titre: "Dossier avec empreinte récente",
      body: d.titre.slice(0, 180),
      href: `/dossiers/${d.uid}`,
      targetUid: d.uid,
    });
  }

  const profil = await profilFromUser(clerkUserId);
  if (!profil) return;

  const candidats = await db
    .select({
      uid: dossiers.uid,
      titre: dossiers.titre,
    })
    .from(dossiers)
    .where(
      and(
        eq(dossiers.legislature, 17),
        sql`EXISTS (
          SELECT 1 FROM empreintes e
          WHERE e.dossier_uid = ${dossiers.uid}
        )`,
      ),
    )
    .orderBy(desc(dossiers.uid))
    .limit(40);

  let created = 0;
  for (const d of candidats) {
    if (created >= MAX_GENERATE) break;
    const rows = await db
      .select({
        axe: empreintes.axe,
        impact: empreintes.impact,
      })
      .from(empreintes)
      .where(eq(empreintes.dossierUid, d.uid));
    const res = computeResonance(profil, rows);
    if (!res || res.score < RESONANCE_THRESHOLD) continue;
    await insertOnce({
      clerkUserId,
      type: "resonance_haute",
      titre: "Forte résonance avec votre Boussole",
      body:
        `${d.titre.slice(0, 140)} — alignement ` +
        `${Math.round(res.score * 100)} %`,
      href: `/dossiers/${d.uid}`,
      targetUid: `resonance:${d.uid}`,
      payload: { score: res.score },
    });
    created += 1;
  }
}

export async function listNotificationsForUser(
  clerkUserId: string,
  opts?: { unreadOnly?: boolean; limit?: number },
) {
  await ensureNotificationsForUser(clerkUserId);
  const limit = opts?.limit ?? 30;
  const unreadOnly = opts?.unreadOnly ?? false;

  return db
    .select()
    .from(notifications)
    .where(
      unreadOnly
        ? and(
            eq(notifications.clerkUserId, clerkUserId),
            isNull(notifications.readAt),
          )
        : eq(notifications.clerkUserId, clerkUserId),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(
  clerkUserId: string,
  id: number,
): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.clerkUserId, clerkUserId),
      ),
    )
    .returning({ id: notifications.id });
  return result.length > 0;
}

export async function markAllNotificationsRead(
  clerkUserId: string,
): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.clerkUserId, clerkUserId),
        isNull(notifications.readAt),
      ),
    );
}
