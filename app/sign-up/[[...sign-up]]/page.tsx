import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

import { PageHeader, PageShell } from "@/components/breadcrumbs";

const APPEARANCE = {
  variables: {
    borderRadius: "0",
    colorPrimary: "#0a0a0a",
    fontFamily: "inherit",
  },
  elements: {
    cardBox: "shadow-none border border-border",
    card: "shadow-none",
  },
};

export default function SignUpPage(): React.ReactElement {
  const hasClerk = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  return (
    <PageShell
      breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Inscription" }]}
    >
      <PageHeader
        title="Inscription"
        description="Un compte est facultatif. Il permet de sauvegarder votre Boussole et de participer aux sondages d'opinion sur les lois et les scrutins."
      />
      {hasClerk ? (
        <div className="mt-10 flex justify-center border-t border-border pt-10">
          <SignUp appearance={APPEARANCE} />
        </div>
      ) : (
        <div className="mt-10 max-w-2xl border-t border-border pt-6">
          <p className="text-base leading-relaxed text-muted-foreground">
            Clerk n&apos;est pas configuré. Ajoutez les clés dans{" "}
            <code className="text-[15px]">.env</code>.
          </p>
          <Link
            href="/"
            className="ln mt-6 inline-block text-[15px] font-medium"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      )}
    </PageShell>
  );
}
