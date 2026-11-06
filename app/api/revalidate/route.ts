import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { OPEN_DATA_TAG } from "@/lib/cache";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request, secret: string): boolean {
  const header = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
}

/**
 * Vide le cache des lectures en base. Appelé par le workflow
 * d'ingestion hebdomadaire, ou à la main après une génération de
 * résumés / empreintes :
 *
 *   curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     https://<site>/api/revalidate
 */
export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET non configuré" },
      { status: 503 },
    );
  }
  if (!isAuthorized(req, secret)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  revalidateTag(OPEN_DATA_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: OPEN_DATA_TAG });
}
