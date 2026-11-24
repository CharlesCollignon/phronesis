import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { FICHES_TAG, OPEN_DATA_TAG } from "@/lib/cache";
import { estTagFiche } from "@/lib/cache-tags";

export const dynamic = "force-dynamic";

/** Au-delà, l'appelant découpe en plusieurs requêtes. */
const MAX_FICHES_PAR_APPEL = 500;

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
 * Invalide le cache des lectures en base. Appelé par
 * `pnpm cache:rafraichir` à la fin des batchs, qui relit ensuite les
 * pages concernées (voir lib/cache.ts).
 *
 * Toujours : listes, accueil, élus, groupes. En plus, selon le corps
 * JSON (facultatif) :
 *   { "fiches": ["dossier:<uid>", "scrutin:<uid>", …] }  ces fiches-là
 *   { "tout": true }                                     toutes les fiches
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

  let corps: { fiches?: unknown; tout?: unknown } = {};
  const brut = (await req.text()).trim();
  if (brut) {
    try {
      const lu: unknown = JSON.parse(brut);
      if (typeof lu !== "object" || lu === null) throw new Error("objet");
      corps = lu;
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }
  }

  const fiches = corps.fiches ?? [];
  if (
    !Array.isArray(fiches) ||
    fiches.length > MAX_FICHES_PAR_APPEL ||
    !fiches.every(estTagFiche)
  ) {
    return NextResponse.json(
      {
        error:
          `fiches : au plus ${MAX_FICHES_PAR_APPEL} étiquettes ` +
          "dossier:<uid> ou scrutin:<uid>",
      },
      { status: 400 },
    );
  }
  const tout = corps.tout === true;

  revalidateTag(OPEN_DATA_TAG, { expire: 0 });
  if (tout) revalidateTag(FICHES_TAG, { expire: 0 });
  for (const tag of new Set(fiches)) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({
    revalidated: { openData: true, tout, fiches: fiches.length },
  });
}
