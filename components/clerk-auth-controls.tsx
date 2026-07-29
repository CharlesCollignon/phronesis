"use client";

import {
  Show,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function ClerkAuthControls({
  collapsed,
  mobileOpen,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
}): React.ReactElement {
  const showLabels = !collapsed || mobileOpen;
  return (
    <div className="flex min-h-10 items-center gap-2 px-1">
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: { avatarBox: "h-8 w-8" },
          }}
        />
        {showLabels ? (
          <span className="truncate text-xs text-muted-foreground">
            Compte
          </span>
        ) : null}
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-none text-xs"
          >
            {showLabels ? "Se connecter" : "→"}
          </Button>
        </SignInButton>
      </Show>
    </div>
  );
}
