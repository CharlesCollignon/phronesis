import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage(): React.ReactElement {
  const hasClerk = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  if (!hasClerk) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">
          Inscription
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Clerk n&apos;est pas configuré. Ajoutez les clés dans{" "}
          <code className="text-xs">.env</code>.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex text-sm text-[var(--accent-ink)] hover:underline"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <SignUp />
    </div>
  );
}
