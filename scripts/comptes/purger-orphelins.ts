/**
 * Rattrapage : efface les données des comptes qui n'existent plus chez
 * Clerk (supprimés avant la mise en place du webhook, ou webhook
 * manqué). Liste par défaut sans rien effacer ; `--appliquer` efface.
 *
 * Usage : pnpm comptes:purger-orphelins [--appliquer]
 */
import { createClerkClient } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";

import { db } from "../../db";
import { supprimerDonneesUtilisateur } from "../../lib/suppression-compte";

const appliquer = process.argv.includes("--appliquer");

async function main(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY manquant");
  const clerk = createClerkClient({ secretKey });

  const rows = await db.execute<{ id: string }>(sql`
    SELECT clerk_user_id AS id FROM user_profiles
    UNION SELECT clerk_user_id FROM notifications
    UNION SELECT clerk_user_id FROM sondages_dossiers
    UNION SELECT clerk_user_id FROM sondages_scrutins
  `);
  const ids = rows.map((r) => r.id);

  const existants = new Set<string>();
  for (let i = 0; i < ids.length; i += 100) {
    const lot = ids.slice(i, i + 100);
    const { data } = await clerk.users.getUserList({
      userId: lot,
      limit: 100,
    });
    for (const u of data) existants.add(u.id);
  }

  const orphelins = ids.filter((id) => !existants.has(id));
  console.log(
    `${ids.length} comptes en base, ${existants.size} existent chez Clerk, ${orphelins.length} orphelins.`,
  );
  if (orphelins.length === 0) return;

  if (!appliquer) {
    console.log("Relancer avec --appliquer pour effacer leurs données.");
    return;
  }
  for (const id of orphelins) {
    const supprime = await supprimerDonneesUtilisateur(id);
    console.log(`${id.slice(0, 12)}… effacé`, supprime);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
