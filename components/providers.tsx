"use client";

import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@/components/theme-provider";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  if (!hasClerk) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }
  return (
    <ClerkProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </ClerkProvider>
  );
}
