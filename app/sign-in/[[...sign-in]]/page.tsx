import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage(): React.ReactElement {
  const hasClerk = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  if (!hasClerk) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-serif text-2xl">
          Connexion
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Clerk n&apos;est pas configuré. Ajoutez{" "}
          <code className="text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
          et <code className="text-xs">CLERK_SECRET_KEY</code> dans{" "}
          <code className="text-xs">.env</code>.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex text-sm text-primary hover:underline"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <SignIn />
    </div>
  );
}
