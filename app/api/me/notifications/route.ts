import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

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

  const rows = await listNotificationsForUser(userId, { limit: 25 });
  const unread = rows.filter((r) => r.readAt == null).length;
  return NextResponse.json({ notifications: rows, unread });
}

export async function PATCH(req: Request): Promise<NextResponse> {
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

  let body: { id?: number; all?: boolean };
  try {
    body = (await req.json()) as { id?: number; all?: boolean };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (body.all) {
    await markAllNotificationsRead(userId);
    return NextResponse.json({ ok: true });
  }

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const ok = await markNotificationRead(userId, body.id);
  if (!ok) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
