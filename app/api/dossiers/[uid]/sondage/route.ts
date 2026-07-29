import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { dossiers, sondagesDossiers } from "@/db/schema";

export const dynamic = "force-dynamic";

const POSITIONS = ["pour", "contre", "pas_avis"] as const;
type Position = (typeof POSITIONS)[number];

type RouteContext = {
  params: Promise<{ uid: string }>;
};

function isPosition(v: unknown): v is Position {
  return (
    typeof v === "string" &&
    (POSITIONS as readonly string[]).includes(v)
  );
}

async function countsForDossier(dossierUid: string): Promise<{
  pour: number;
  contre: number;
  pasAvis: number;
  total: number;
}> {
  const rows = await db.execute<{
    position: string;
    n: number;
  }>(sql`
    SELECT position, count(*)::int AS n
    FROM sondages_dossiers
    WHERE dossier_uid = ${dossierUid}
    GROUP BY position
  `);

  let pour = 0;
  let contre = 0;
  let pasAvis = 0;
  for (const r of rows) {
    if (r.position === "pour") pour = r.n;
    else if (r.position === "contre") contre = r.n;
    else if (r.position === "pas_avis") pasAvis = r.n;
  }
  return {
    pour,
    contre,
    pasAvis,
    total: pour + contre + pasAvis,
  };
}

export async function GET(
  _req: Request,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { uid } = await ctx.params;

  const [dossier] = await db
    .select({ uid: dossiers.uid })
    .from(dossiers)
    .where(eq(dossiers.uid, uid))
    .limit(1);
  if (!dossier) {
    return NextResponse.json({ error: "Dossier inconnu" }, { status: 404 });
  }

  const counts = await countsForDossier(uid);

  let mine: Position | null = null;
  const secret = process.env.CLERK_SECRET_KEY;
  const pub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (secret && pub) {
    const { userId } = await auth();
    if (userId) {
      const [row] = await db
        .select({ position: sondagesDossiers.position })
        .from(sondagesDossiers)
        .where(
          and(
            eq(sondagesDossiers.dossierUid, uid),
            eq(sondagesDossiers.clerkUserId, userId),
          ),
        )
        .limit(1);
      if (row && isPosition(row.position)) mine = row.position;
    }
  }

  return NextResponse.json({ counts, mine });
}

export async function POST(
  req: Request,
  ctx: RouteContext,
): Promise<NextResponse> {
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    return NextResponse.json(
      { error: "Clerk non configuré" },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { uid } = await ctx.params;
  const [dossier] = await db
    .select({ uid: dossiers.uid })
    .from(dossiers)
    .where(eq(dossiers.uid, uid))
    .limit(1);
  if (!dossier) {
    return NextResponse.json({ error: "Dossier inconnu" }, { status: 404 });
  }

  let body: { position?: unknown };
  try {
    body = (await req.json()) as { position?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!isPosition(body.position)) {
    return NextResponse.json(
      { error: "position invalide (pour|contre|pas_avis)" },
      { status: 400 },
    );
  }

  const now = new Date();
  await db
    .insert(sondagesDossiers)
    .values({
      dossierUid: uid,
      clerkUserId: userId,
      position: body.position,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        sondagesDossiers.dossierUid,
        sondagesDossiers.clerkUserId,
      ],
      set: {
        position: body.position,
        updatedAt: now,
      },
    });

  const counts = await countsForDossier(uid);
  return NextResponse.json({ counts, mine: body.position });
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext,
): Promise<NextResponse> {
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    return NextResponse.json(
      { error: "Clerk non configuré" },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { uid } = await ctx.params;
  const [dossier] = await db
    .select({ uid: dossiers.uid })
    .from(dossiers)
    .where(eq(dossiers.uid, uid))
    .limit(1);
  if (!dossier) {
    return NextResponse.json({ error: "Dossier inconnu" }, { status: 404 });
  }

  await db
    .delete(sondagesDossiers)
    .where(
      and(
        eq(sondagesDossiers.dossierUid, uid),
        eq(sondagesDossiers.clerkUserId, userId),
      ),
    );

  const counts = await countsForDossier(uid);
  return NextResponse.json({ counts, mine: null });
}
