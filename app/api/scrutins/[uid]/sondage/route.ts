import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { scrutins, sondagesScrutins } from "@/db/schema";
import { SONDAGES_TAG, tagSondageScrutin } from "@/lib/cache";
import { getSondageScrutin } from "@/lib/sondages";

export const dynamic = "force-dynamic";

const POSITIONS = [
  "pour",
  "contre",
  "abstention",
  "pas_avis",
] as const;
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

async function countsForScrutin(scrutinUid: string): Promise<{
  pour: number;
  contre: number;
  abstention: number;
  pasAvis: number;
  total: number;
}> {
  const rows = await db.execute<{
    position: string;
    n: number;
  }>(sql`
    SELECT position, count(*)::int AS n
    FROM sondages_scrutins
    WHERE scrutin_uid = ${scrutinUid}
    GROUP BY position
  `);

  let pour = 0;
  let contre = 0;
  let abstention = 0;
  let pasAvis = 0;
  for (const r of rows) {
    if (r.position === "pour") pour = r.n;
    else if (r.position === "contre") contre = r.n;
    else if (r.position === "abstention") abstention = r.n;
    else if (r.position === "pas_avis") pasAvis = r.n;
  }
  return {
    pour,
    contre,
    abstention,
    pasAvis,
    total: pour + contre + abstention + pasAvis,
  };
}

/**
 * Totaux lus en cache : seul l'avis d'un utilisateur connecté
 * interroge la base. La fiche affiche déjà les totaux, le composant
 * n'appelle cette route que pour retrouver cet avis.
 */
export async function GET(
  _req: Request,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { uid } = await ctx.params;

  const counts = await getSondageScrutin(uid);

  let mine: Position | null = null;
  if (
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    const { userId } = await auth();
    if (userId) {
      const [row] = await db
        .select({ position: sondagesScrutins.position })
        .from(sondagesScrutins)
        .where(
          and(
            eq(sondagesScrutins.scrutinUid, uid),
            eq(sondagesScrutins.clerkUserId, userId),
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
  const [scrutin] = await db
    .select({ uid: scrutins.uid })
    .from(scrutins)
    .where(eq(scrutins.uid, uid))
    .limit(1);
  if (!scrutin) {
    return NextResponse.json({ error: "Scrutin inconnu" }, { status: 404 });
  }

  let body: { position?: unknown };
  try {
    body = (await req.json()) as { position?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!isPosition(body.position)) {
    return NextResponse.json(
      {
        error:
          "position invalide (pour|contre|abstention|pas_avis)",
      },
      { status: 400 },
    );
  }

  const now = new Date();
  await db
    .insert(sondagesScrutins)
    .values({
      scrutinUid: uid,
      clerkUserId: userId,
      position: body.position,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        sondagesScrutins.scrutinUid,
        sondagesScrutins.clerkUserId,
      ],
      set: {
        position: body.position,
        updatedAt: now,
      },
    });
  revalidateTag(SONDAGES_TAG, { expire: 0 });
  revalidateTag(tagSondageScrutin(uid), { expire: 0 });

  const counts = await countsForScrutin(uid);
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
  const [scrutin] = await db
    .select({ uid: scrutins.uid })
    .from(scrutins)
    .where(eq(scrutins.uid, uid))
    .limit(1);
  if (!scrutin) {
    return NextResponse.json({ error: "Scrutin inconnu" }, { status: 404 });
  }

  await db
    .delete(sondagesScrutins)
    .where(
      and(
        eq(sondagesScrutins.scrutinUid, uid),
        eq(sondagesScrutins.clerkUserId, userId),
      ),
    );
  revalidateTag(SONDAGES_TAG, { expire: 0 });
  revalidateTag(tagSondageScrutin(uid), { expire: 0 });

  const counts = await countsForScrutin(uid);
  return NextResponse.json({ counts, mine: null });
}
