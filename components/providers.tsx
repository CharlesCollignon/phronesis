"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";

import { ThemeProvider } from "@/components/theme-provider";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

/**
 * Interface Clerk en français. Le message de suppression du compte par
 * défaut dit que des données « peuvent être conservées » : ici tout est
 * effacé (webhook user.deleted), on le dit.
 */
const localization = {
  ...frFR,
  userProfile: {
    ...frFR.userProfile,
    deletePage: {
      ...frFR.userProfile?.deletePage,
      messageLine1:
        "Êtes-vous sûr de vouloir supprimer votre compte ? Votre Boussole, vos préférences, vos notifications et vos avis aux consultations seront effacés.",
    },
  },
};

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  if (!hasClerk) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }
  return (
    <ClerkProvider localization={localization}>
      <ThemeProvider>{children}</ThemeProvider>
    </ClerkProvider>
  );
}
