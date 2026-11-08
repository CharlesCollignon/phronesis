import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { SONDAGES_TAG } from "@/lib/cache";
import { supprimerDonneesUtilisateur } from "@/lib/suppression-compte";

export const dynamic = "force-dynamic";

/**
 * Webhook Clerk. À la suppression d'un compte (`user.deleted`), efface
 * toutes ses données en base (RGPD, droit à l'effacement).
 *
 * Configuration : Clerk Dashboard → Webhooks → endpoint
 * `https://<site>/api/webhooks/clerk`, événement `user.deleted`, puis
 * copier le secret de signature dans CLERK_WEBHOOK_SIGNING_SECRET.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SIGNING_SECRET non configuré" },
      { status: 503 },
    );
  }

  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (evt.type !== "user.deleted") {
    return NextResponse.json({ ignore: evt.type });
  }

  const userId = evt.data.id;
  if (!userId) {
    return NextResponse.json({ error: "Identifiant absent" }, { status: 400 });
  }

  const supprime = await supprimerDonneesUtilisateur(userId);
  if (supprime.consultationsDossiers + supprime.consultationsScrutins > 0) {
    revalidateTag(SONDAGES_TAG, { expire: 0 });
  }
  return NextResponse.json({ supprime });
}
