import { BoussoleQuiz } from "@/components/boussole-quiz";
import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { DILEMMES } from "@/lib/dilemmes";

export const metadata = {
  title: "Boussole Phronesis",
};

export default function BoussolePage(): React.ReactElement {
  return (
    <PageShell
      breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Boussole" }]}
    >
      <PageHeader
        title="Boussole"
        description={
          <>
            <p>
              {DILEMMES.length}&nbsp;dilemmes, aucune question de type gauche
              ou droite. Chaque dilemme expose un contexte, un enjeu explicite
              et quatre réponses : des logiques distinctes, pas un simple
              oui/non ni un curseur.
            </p>
            <p className="mt-3 text-base">
              Vos réponses dessinent une carte de valeurs sur dix axes, puis
              la comparent à des conceptions philosophiques, pas à des
              partis.
            </p>
          </>
        }
        aside={
          <p className="max-w-[300px] text-sm leading-relaxed text-muted-foreground">
            Connectez-vous pour sauvegarder votre profil sur votre compte.
            Sans compte, les réponses ne sont pas conservées entre les
            visites.
          </p>
        }
      />
      <div className="mt-10">
        <BoussoleQuiz />
      </div>
    </PageShell>
  );
}
