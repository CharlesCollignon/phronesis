import { BoussoleQuiz } from "@/components/boussole-quiz";
import { PageShell } from "@/components/breadcrumbs";
import { DILEMMES } from "@/lib/dilemmes";

export const metadata = {
  title: "Boussole Phronesis",
};

export default function BoussolePage(): React.ReactElement {
  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Boussole" },
      ]}
    >
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Boussole Phronesis
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        {DILEMMES.length} dilemmes, chacun avec un contexte, un enjeu
        explicite et 4 réponses graduées (pas un simple oui/non).
        L&apos;application ne demande jamais si vous êtes de gauche
        ou de droite : elle construit une carte de valeurs, puis la
        compare à des conceptions philosophiques — pas à des partis.
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Connectez-vous pour sauvegarder votre profil sur votre compte.
        Sans compte, les réponses ne sont pas conservées entre les
        visites.
      </p>
      <div className="mt-10">
        <BoussoleQuiz />
      </div>
    </PageShell>
  );
}
