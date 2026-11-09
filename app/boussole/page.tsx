import { BoussoleQuiz } from "@/components/boussole-quiz";
import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { DILEMMES } from "@/lib/dilemmes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Boussole : test de valeurs politiques sans étiquette",
  description:
    "Un test de valeurs en dilemmes concrets, sans gauche ni droite : situez-vous sur dix axes (liberté, égalité, écologie…) et comparez-vous aux lois votées.",
  path: "/boussole",
});

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
