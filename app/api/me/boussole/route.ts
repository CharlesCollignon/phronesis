import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { userProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

type BoussoleBody = {
  reponses?: Record<string, string>;
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

  return NextResponse.json({
    reponses: row?.boussoleReponses ?? {},
    theme: row?.theme ?? null,
    engagement: row?.engagement ?? {},
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

  const now = new Date();
  await db
    .insert(userProfiles)
    .values({
      clerkUserId: userId,
      boussoleReponses: reponses,
      engagement: engagement ?? {},
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userProfiles.clerkUserId,
      set: {
        boussoleReponses: reponses,
        ...(engagement ? { engagement } : {}),
        updatedAt: now,
      },
    });

  return NextResponse.json({ ok: true, reponses, engagement });
}
