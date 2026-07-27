"use client";

import {
  Show,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

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
        {showLabels && (
          <span className="truncate text-xs text-[var(--sidebar-muted)]">
            Compte
          </span>
        )}
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className={
              "flex min-h-10 w-full items-center justify-center " +
              "border border-[var(--accent)]/40 px-2 " +
              "text-xs font-medium text-[var(--accent)] " +
              "hover:bg-white/5"
            }
          >
            {showLabels ? "Se connecter" : "→"}
          </button>
        </SignInButton>
      </Show>
    </div>
  );
}
