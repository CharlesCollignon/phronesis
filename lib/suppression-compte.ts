import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  notifications,
  sondagesDossiers,
  sondagesScrutins,
  userProfiles,
} from "@/db/schema";

export type DonneesSupprimees = {
  profil: number;
  notifications: number;
  consultationsDossiers: number;
  consultationsScrutins: number;
};

/**
 * Efface toutes les données liées à un compte Clerk : profil (Boussole,
 * préférences, consentement), notifications et avis donnés aux
 * consultations. Appelé quand le compte est supprimé (webhook Clerk)
 * et par le script de rattrapage des comptes orphelins.
 */
export async function supprimerDonneesUtilisateur(
  clerkUserId: string,
): Promise<DonneesSupprimees> {
  return db.transaction(async (tx) => {
    const profil = await tx
      .delete(userProfiles)
      .where(eq(userProfiles.clerkUserId, clerkUserId))
      .returning({ id: userProfiles.clerkUserId });
    const notifs = await tx
      .delete(notifications)
      .where(eq(notifications.clerkUserId, clerkUserId))
      .returning({ id: notifications.id });
    const dossiers = await tx
      .delete(sondagesDossiers)
      .where(eq(sondagesDossiers.clerkUserId, clerkUserId))
      .returning({ id: sondagesDossiers.id });
    const scrutins = await tx
      .delete(sondagesScrutins)
      .where(eq(sondagesScrutins.clerkUserId, clerkUserId))
      .returning({ id: sondagesScrutins.id });
    return {
      profil: profil.length,
      notifications: notifs.length,
      consultationsDossiers: dossiers.length,
      consultationsScrutins: scrutins.length,
    };
  });
}
