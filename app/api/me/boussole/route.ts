import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { userProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

type BoussoleBody = {
  reponses?: Record<string, string>;
  /** L'utilisateur accepte l'enregistrement de ses réponses sur le compte. */
  consentement?: boolean;
  /** L'utilisateur retire son accord : réponses effacées du compte. */
  retraitConsentement?: boolean;
  engagement?: {
    lastVisit?: string;
    streakDays?: number;
  };
};

function clerkConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    Boolean(process.env.CLERK_SECRET_KEY)
  );
}

export async function GET(): Promise<NextResponse> {
  if (!clerkConfigured()) {
    return NextResponse.json(
      { error: "Clerk non configuré" },
      { status: 503 },
    );
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  const consentement = row?.engagement?.consentementBoussoleLe ?? null;
  return NextResponse.json({
    // Sans consentement, aucune réponse n'est renvoyée (ni conservée).
    reponses: consentement ? (row?.boussoleReponses ?? {}) : {},
    theme: row?.theme ?? null,
    engagement: row?.engagement ?? {},
    consentement,
    updatedAt: row?.updatedAt ?? null,
  });
}

export async function PUT(req: Request): Promise<NextResponse> {
  if (!clerkConfigured()) {
    return NextResponse.json(
      { error: "Clerk non configuré" },
      { status: 503 },
    );
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: BoussoleBody;
  try {
    body = (await req.json()) as BoussoleBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const reponses =
    body.reponses && typeof body.reponses === "object"
      ? body.reponses
      : {};

  const engagement =
    body.engagement && typeof body.engagement === "object"
      ? {
          lastVisit:
            typeof body.engagement.lastVisit === "string"
              ? body.engagement.lastVisit
              : undefined,
          streakDays:
            typeof body.engagement.streakDays === "number"
              ? body.engagement.streakDays
              : undefined,
        }
      : undefined;

  const [existant] = await db
    .select({ engagement: userProfiles.engagement })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  // Consentement : accordé dans cette requête, déjà enregistré, ou
  // retiré (les réponses sont alors effacées du compte).
  const now = new Date();
  let consentementLe = existant?.engagement?.consentementBoussoleLe;
  if (body.retraitConsentement) consentementLe = undefined;
  else if (body.consentement === true) {
    consentementLe ??= now.toISOString();
  }
  const reponsesEnregistrees = body.retraitConsentement ? {} : reponses;
  if (Object.keys(reponsesEnregistrees).length > 0 && !consentementLe) {
    return NextResponse.json(
      { error: "Consentement requis pour enregistrer la Boussole" },
      { status: 403 },
    );
  }

  const engagementFinal = {
    ...(existant?.engagement ?? {}),
    ...(engagement ?? {}),
    consentementBoussoleLe: consentementLe,
  };
  await db
    .insert(userProfiles)
    .values({
      clerkUserId: userId,
      boussoleReponses: reponsesEnregistrees,
      engagement: engagementFinal,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userProfiles.clerkUserId,
      set: {
        boussoleReponses: reponsesEnregistrees,
        engagement: engagementFinal,
        updatedAt: now,
      },
    });

  return NextResponse.json({
    ok: true,
    reponses: reponsesEnregistrees,
    engagement: engagementFinal,
    consentement: consentementLe ?? null,
  });
}
