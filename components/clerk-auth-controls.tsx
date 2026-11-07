"use client";

import {
  Show,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

/** Connexion / compte Clerk, sur fond noir (en-tête). */
export function ClerkAuthControls(): React.ReactElement {
  return (
    <div className="flex min-h-9 items-center">
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: { avatarBox: "h-8 w-8" },
          }}
        />
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="ml-2 text-[15px] text-[#c4c4c4] transition-colors hover:text-white"
          >
            <span className="roll">
              <span>
                <span>Connexion</span>
                <span aria-hidden>Connexion</span>
              </span>
            </span>
          </button>
        </SignInButton>
      </Show>
    </div>
  );
}
