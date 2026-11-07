import Link from "next/link";

import { ExternalLink } from "@/components/external-link";
import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { formatDate, formatNumber } from "@/lib/format";
import { getImportHistory } from "@/lib/queries";
import { urlOpenDataAn, urlOpenDataSenat } from "@/lib/urls";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Méthodologie",
};

const TOC: [string, string][] = [
  ["sources", "Sources"],
  ["limite", "Limite essentielle"],
  ["elus", "Statistiques des élus"],
  ["comparateur", "Comparateur"],
  ["score", "Score Phronesis"],
  ["empreinte", "Empreinte civique"],
  ["reperes-civiques", "Repères civiques"],
  ["resumes", "Résumés IA"],
  ["boussole", "Boussole"],
  ["philosophies", "Conceptions philosophiques"],
  ["resonance", "Résonance"],
  ["groupes", "Empreinte des groupes"],
  ["transparence", "Transparence"],
  ["hors-perimetre", "Hors périmètre"],
  ["compte", "Compte optionnel"],
  ["sondages", "Sondages citoyens"],
  ["fil", "Fil « À l'Assemblée »"],
  ["imports", "Historique des imports"],
];

const SCORE: [string, number][] = [
  ["Documents liés", 20],
  ["Diversité des types de documents", 15],
  ["Actes procéduraux", 20],
  ["Scrutins publics liés", 15],
  ["Amendements", 10],
  ["Résumé de vulgarisation", 10],
  ["Empreinte civique", 10],
];

function Section({
  id,
  title,
  first = false,
  children,
}: {
  id: string;
  title: React.ReactNode;
  first?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className={cn(
        "scroll-mt-24 border-t py-9",
        first ? "border-foreground pt-7" : "border-border",
      )}
    >
      <h2
        id={`${id}-titre`}
        className="text-2xl font-semibold leading-tight tracking-[-0.01em]"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

const P = "mt-3.5 text-[17px] leading-[1.7]";
const UL = "mt-3.5 list-disc space-y-1.5 pl-5 text-[17px] leading-[1.7]";
const H3 = "mt-6 text-[17px] font-semibold";

export default async function MethodologiePage(): Promise<React.ReactElement> {
  const history = await getImportHistory();

  return (
    <PageShell
      breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Méthodologie" }]}
    >
      <PageHeader
        title="Méthodologie"
        description="Phronesis n'oriente pas le jugement. Cette page documente d'où viennent les données, comment chaque chiffre est calculé, et ce que les sources ne permettent pas de dire."
      />

      <div className="mt-14 flex flex-wrap items-start gap-16">
        <nav
          aria-label="Sommaire"
          className="sticky top-24 hidden max-h-[calc(100vh-7rem)] flex-[0_0_240px] overflow-y-auto lg:block"
        >
          <p className="eyebrow pb-2.5">Sommaire</p>
          <ul>
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={cn(
                    "relative block py-2 pl-4 text-[15px] text-muted-foreground transition-colors hover:text-foreground",
                    "before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:origin-top before:scale-y-0 before:bg-[var(--accent)]",
                    "before:transition-transform before:duration-500 before:ease-[var(--spring)] hover:before:scale-y-100",
                  )}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-[780px] flex-[1_1_560px]">
          <Section id="sources" title="Sources" first>
            <ul className={UL}>
              <li>
                Open data de l&apos;Assemblée nationale,{" "}
                <ExternalLink href={urlOpenDataAn()} className="text-[17px]">
                  data.assemblee-nationale.fr
                </ExternalLink>
                , licence ouverte. Jeux : AMO (acteurs/organes), dossiers,
                scrutins, amendements (17<sup>e</sup> législature).
              </li>
              <li>
                Open data du Sénat,{" "}
                <ExternalLink href={urlOpenDataSenat()} className="text-[17px]">
                  data.senat.fr
                </ExternalLink>{" "}
                : ODSEN (matricules sénateurs) et Dosleg (scrutins publics et
                votes nominatifs depuis 2006).
              </li>
              <li>
                Les sénateurs AMO sont reliés aux votes Dosleg par appariement
                nominatif du matricule ODSEN (les non-appariés sont exclus des
                votes).
              </li>
              <li>
                Chaque fiche renvoie vers la page officielle
                (assemblee-nationale.fr ou senat.fr).
              </li>
            </ul>
          </Section>

          <Section
            id="limite"
            title="Limite essentielle : scrutins publics uniquement"
          >
            <p className={P}>
              La majorité des votes en séance se font à main levée et ne
              produisent aucune trace nominative. Phronesis n&apos;affiche
              donc que les <strong>scrutins publics</strong>.
            </p>
            <p className="mt-4 bg-[var(--highlight)] px-[18px] py-4 text-base leading-relaxed shadow-[inset_3px_0_0_0_var(--accent)] dark:text-foreground">
              Quand un dossier n&apos;a aucun scrutin lié, cela ne signifie
              pas qu&apos;il n&apos;a pas été voté, seulement que le vote
              n&apos;était pas nominatif dans les données ouvertes.
            </p>
          </Section>

          <Section id="elus" title="Calcul des statistiques députés">
            <h3 className={H3}>Participation</h3>
            <p className={P}>
              (nombre de positions hors « non-votant ») / (nombre de scrutins
              publics où le député apparaît dans le décompte nominatif).
            </p>
            <h3 className={H3}>Fidélité au groupe</h3>
            <p className={P}>
              Pour chaque scrutin où le député a une position
              pour/contre/abstention et un groupe renseigné : on calcule la
              position majoritaire du groupe, puis on compte l&apos;accord.
              Les non-votants sont exclus du calcul.
            </p>
            <h3 className={H3}>Amendements</h3>
            <p className={P}>
              Comptage des amendements où le député est auteur principal, et
              de ceux dont le sort contient « adopt ».
            </p>
          </Section>

          <Section id="comparateur" title="Comparateur">
            <p className={P}>
              Pour deux députés : on ne retient que les scrutins publics où
              les deux ont une position pour, contre ou abstention. Le taux
              d&apos;accord est le ratio accords / scrutins ainsi comparés.
              Les non-votants sont exclus du dénominateur et indiqués à part.
            </p>
            <p className={P}>
              Pour deux groupes : on prend d&apos;abord la position
              majoritaire de chaque groupe (mode statistique) sur chaque
              scrutin, puis la même logique d&apos;accord.
            </p>
          </Section>

          <Section id="score" title="Score Phronesis (SCORE_PHRONESIS_V1)">
            <p className={P}>
              Score déterministe de <strong>robustesse documentaire</strong>,
              jamais une note morale sur la loi. Total sur 100 points :
            </p>
            <dl className="mt-4 border-b border-border">
              {SCORE.map(([label, pts]) => (
                <div
                  key={label}
                  className="grid grid-cols-[minmax(0,1fr)_64px] gap-4 border-t border-border py-3 text-base"
                >
                  <dt>{label}</dt>
                  <dd className="num text-right font-semibold">{pts}</dd>
                </div>
              ))}
              <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-4 border-t border-foreground py-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="num text-right font-semibold">
                  {SCORE.reduce((n, [, p]) => n + p, 0)}
                </dd>
              </div>
            </dl>
            <p className={P}>
              Des paliers partiels s&apos;appliquent (ex. moins de points
              s&apos;il n&apos;y a qu&apos;un type de document ou peu
              d&apos;actes). Le détail des critères est affiché sur chaque
              fiche dossier.
            </p>
          </Section>

          <Section id="empreinte" title="Empreinte civique">
            <p className={P}>
              Empreinte <strong>qualitative</strong> : aucun score numérique
              par axe. Pour chacun des dix axes (liberté, égalité, sécurité,
              vie privée, solidarité, responsabilité individuelle, État de
              droit, efficacité économique, durabilité, souveraineté), un
              impact parmi : renforce, restreint, mitigé, non abordé,
              indéterminé, avec justification et sources.
            </p>
            <p className={P}>
              Générée hors ligne (batch IA), stockée avec modèle et version de
              prompt. L&apos;IA ne tranche jamais « bonne » ou « mauvaise »
              loi.
            </p>
          </Section>

          <Section id="reperes-civiques" title="Repères civiques (non mesurés)">
            <p className={P}>
              Phronesis cite deux textes publics comme{" "}
              <strong>repères</strong>, pas comme grilles
              d&apos;évaluation. Les axes de l&apos;Empreinte et de la
              Boussole restent un{" "}
              <strong>outil pédagogique propriétaire</strong> ; certains mots
              (liberté, égalité, dignité…) peuvent faire écho à ces textes,{" "}
              <strong>sans</strong> prétendre en mesurer la conformité.
            </p>
            <h3 id="ddhc" className={cn(H3, "scroll-mt-24")}>
              Déclaration des droits de l&apos;homme et du citoyen (1789)
            </h3>
            <p className={P}>
              La DDHC fait partie du <em>bloc de constitutionnalité</em>{" "}
              français. Repère historique et civique pour le cadre national.
              Texte officiel :{" "}
              <ExternalLink
                href="https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/declaration-des-droits-de-l-homme-et-du-citoyen-de-1789"
                className="text-[17px]"
              >
                DDHC de 1789
              </ExternalLink>{" "}
              (Conseil constitutionnel).
            </p>
            <h3 id="dudh" className={cn(H3, "scroll-mt-24")}>
              Déclaration universelle des droits de l&apos;homme (1948)
            </h3>
            <p className={P}>
              La DUDH est un repère universel (dignité, droits civils et
              sociaux) qui élargit le vocabulaire civique. Texte officiel :{" "}
              <ExternalLink
                href="https://www.un.org/fr/about-us/universal-declaration-of-human-rights"
                className="text-[17px]"
              >
                DUDH de 1948
              </ExternalLink>{" "}
              (Nations Unies).
            </p>
            <p className={cn(P, "text-muted-foreground")}>
              Phronesis ne se substitue pas au contrôle de constitutionnalité
              ni à une évaluation au regard des droits humains ; aucun score
              de conformité n&apos;est calculé.
            </p>
          </Section>

          <Section id="resumes" title="Résumés IA">
            <p className={P}>
              Les résumés sont générés hors ligne (batch), stockés avec le
              modèle, la version du prompt et les sources utilisées. Ils sont
              toujours présentés dans un encadré distinct de la « version
              officielle ». L&apos;IA ne produit pas de jugement moral ni de
              recommandation de vote.
            </p>
          </Section>

          <Section id="boussole" title="Boussole Phronesis">
            <p className={P}>
              Questionnaire de dilemmes (pas de question gauche/droite).
              Chaque dilemme expose un <strong>contexte</strong> et un{" "}
              <strong>enjeu</strong>, puis propose{" "}
              <strong>4 réponses</strong> : quatre logiques distinctes (non un
              spectre A↔B), avec poids rédigés à la main. Chaque choix pondère
              des axes de valeurs.
            </p>
            <p className={P}>
              Pour chaque axe, la somme des poids de vos choix est replacée
              dans l&apos;étendue que les dilemmes permettaient
              d&apos;atteindre sur cet axe : −1 correspond aux réponses qui le
              minorent le plus, +1 à celles qui le valorisent le plus, 0 au
              milieu. Un choix qui ne mentionne pas l&apos;axe compte pour
              zéro. Ainsi, une seule réponse ne suffit pas à saturer un axe, et
              un axe que les dilemmes valorisent plus souvent qu&apos;ils ne le
              minorent ne penche pas d&apos;office d&apos;un côté.
            </p>
            <p className={P}>
              Chaque axe affiche une <strong>fiabilité</strong> selon le
              nombre de dilemmes qui le mesurent : bonne à partir de 5,
              moyenne de 3 à 4, faible en dessous. Le profil est ensuite
              comparé par similarité cosinus à des conceptions philosophiques
              de référence. Compte optionnel (Clerk) pour synchroniser ; sinon
              localStorage.
            </p>
          </Section>

          <Section id="philosophies" title="Conceptions philosophiques">
            <p className={P}>
              Six profils de référence (libéralisme, républicanisme,
              socialisme démocratique, écologie politique, conservatisme,
              libertarisme) sont présentés sur des fiches dédiées (
              <Link href="/philosophies" className="ln">
                /philosophies
              </Link>
              ). Ce sont des idéal-types sur les axes de la Boussole, pas des
              partis. Le glossaire des dix axes y est également publié.
            </p>
          </Section>

          <Section
            id="resonance"
            title="Résonance valeurs (Boussole ↔ Empreinte)"
          >
            <p className={P}>
              Sur une fiche dossier (et plus tard un groupe), si vous avez
              rempli la Boussole, Phronesis peut afficher une{" "}
              <strong>résonance</strong> : proximité cosinus entre votre
              profil et une projection de l&apos;empreinte qualitative. Ce
              n&apos;est <strong>pas</strong> le Score Phronesis (robustesse
              documentaire) et ce n&apos;est pas un jugement moral sur la loi.
            </p>
            <ul className={UL}>
              <li>
                Mapping explicite Empreinte → Boussole (ex. durabilité →
                écologie ; efficacité économique → marché ; sécurité →
                autorité, avec prudence).
              </li>
              <li>
                Projection : renforce = +1, restreint = −1, mitigé = 0 ; non
                abordé / indéterminé exclus.
              </li>
              <li>
                Axes Empreinte sans mapping fiable (État de droit,
                souveraineté) restent dans l&apos;empreinte mais sont exclus
                de la résonance.
              </li>
              <li>
                La couverture (« N axes comparés ») est toujours affichée.
              </li>
            </ul>
          </Section>

          <Section id="groupes" title="Empreinte agrégée des groupes">
            <p className={P}>
              Pour un groupe parlementaire (AN ou Sénat), Phronesis agrège les
              empreintes des dossiers sur lesquels le groupe a une majorité
              pour ou contre : le vecteur est ajouté (pour) ou inversé
              (contre), puis normalisé.
            </p>
            <p className={P}>
              Seuls comptent les votes qui portent sur le texte lui-même :
              vote sur l&apos;ensemble, article unique, texte entier ou partie
              d&apos;une loi de finances. Les motions de censure (qui portent
              sur la confiance au gouvernement) et les motions de rejet ou de
              renvoi (parfois votées par la majorité contre son propre texte,
              pour l&apos;envoyer directement en commission mixte paritaire)
              sont exclues. Un dossier voté plusieurs fois ne compte
              qu&apos;une fois, avec le dernier vote où le groupe a tranché.
            </p>
            <p className={P}>
              Limites : scrutins publics seulement ; dossiers sans empreinte
              exclus ; majorité ≠ unanimité. Aucun score philosophique
              n&apos;est calculé au niveau d&apos;un élu.
            </p>
          </Section>

          <Section
            id="transparence"
            title="Transparence (HATVP et décisions définitives)"
          >
            <p className={P}>
              Sur les fiches député et sénateur uniquement, un bloc minimal «
              Transparence » peut afficher :
            </p>
            <ul className={UL}>
              <li>
                un lien vers la <strong>fiche nominative HATVP</strong>{" "}
                (déclarations publiques d&apos;intérêts / patrimoine selon le
                droit applicable), issu du CSV open data HATVP. Appariement
                strict : député via <code className="text-[15px]">id_origine</code>{" "}
                → <code className="text-[15px]">PA…</code> ; sénateur via
                matricule Sénat. En cas d&apos;échec ou d&apos;ambiguïté,
                aucun lien n&apos;est affiché (pas de mention négative).
              </li>
              <li>
                d&apos;éventuelles{" "}
                <strong>décisions judiciaires publiques définitives</strong>,
                curatées manuellement dans un fichier versionné, jamais
                scrapées depuis la presse, jamais issues du casier judiciaire
                (non public).
              </li>
            </ul>
            <p className={P}>
              Critères pour ajouter une décision : condamnation définitive ;
              source officielle nominative ; exclusion des procédures en
              cours, non-lieux, relaxes et mises en examen. L&apos;absence
              d&apos;entrée signifie seulement « aucune décision définitive
              référencée dans Phronesis », <strong>pas</strong> « casier
              vierge ». Aucun score d&apos;intégrité n&apos;est calculé.
            </p>
          </Section>

          <Section
            id="hors-perimetre"
            title="Hors périmètre (pour l'instant)"
          >
            <ul className={UL}>
              <li>
                Légifrance ; ingestion des décisions du Conseil
                constitutionnel ; contrôle de conformité constitutionnelle ou
                score « droits humains » (les citations éducatives DDHC et
                DUDH, liens officiels, ne sont pas une analyse juridique)
              </li>
              <li>Profil philosophique par élu (député / sénateur)</li>
              <li>Casier judiciaire / affaires en cours / agrégats presse</li>
              <li>Diffs d&apos;amendements sur le texte</li>
              <li>
                Notifications push / e-mail, chat, votes citoyens sur scrutins
                (les alertes in-app Boussole existent)
              </li>
            </ul>
          </Section>

          <Section id="compte" title="Compte optionnel (Clerk)">
            <p className={P}>
              La consultation des données open data reste possible sans
              compte. Un compte (Google ou autres providers activés dans
              Clerk) permet de sauvegarder la Boussole et de participer aux
              sondages d&apos;opinion sur les dossiers.
            </p>
          </Section>

          <Section id="sondages" title="Sondages citoyens">
            <h3 id="sondage-lois" className={cn(H3, "scroll-mt-24")}>
              Sondage citoyen sur les lois
            </h3>
            <p className={P}>
              Sur chaque fiche dossier, les utilisateurs connectés peuvent
              indiquer <strong>pour</strong>, <strong>contre</strong> ou{" "}
              <strong>pas d&apos;avis</strong>. C&apos;est un sondage
              d&apos;opinion Phronesis, jamais un scrutin parlementaire. Un
              avis par utilisateur et par dossier, modifiable.
            </p>
            <h3 id="sondage-scrutins" className={cn(H3, "scroll-mt-24")}>
              Sondage citoyen sur les scrutins
            </h3>
            <p className={P}>
              Sur chaque fiche scrutin public, les utilisateurs connectés
              peuvent indiquer <strong>pour</strong>,{" "}
              <strong>contre</strong>, <strong>abstention</strong> ou{" "}
              <strong>pas d&apos;avis</strong>. L&apos;interface compare
              visuellement le décompte officiel des députés au sondage
              citoyen Phronesis, toujours distinct d&apos;un vote
              parlementaire.
            </p>
          </Section>

          <Section id="fil" title="Fil « À l'Assemblée »">
            <p className={P}>
              L&apos;actualité affichée sur l&apos;accueil et la page{" "}
              <code className="text-[15px]">/actualite</code> est dérivée des
              dossiers et scrutins publics déjà en base. Ce n&apos;est pas un
              agrégateur presse ni un fil de réseaux sociaux.
            </p>
          </Section>

          <section
            id="imports"
            aria-labelledby="imports-titre"
            className="scroll-mt-24 border-y border-border py-9"
          >
            <h2
              id="imports-titre"
              className="text-2xl font-semibold leading-tight tracking-[-0.01em]"
            >
              Historique des imports
            </h2>
            {history.length === 0 ? (
              <p className={cn(P, "text-muted-foreground")}>
                Aucun import enregistré.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[15px]">
                  <thead className="text-[13px] text-muted-foreground">
                    <tr>
                      <th scope="col" className="pb-2.5 pr-4 font-normal">
                        Jeu
                      </th>
                      <th
                        scope="col"
                        className="pb-2.5 pr-4 text-right font-normal"
                      >
                        Lignes
                      </th>
                      <th scope="col" className="pb-2.5 text-right font-normal">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="py-2.5 pr-4">{row.dataset}</td>
                        <td className="num py-2.5 pr-4 text-right">
                          {formatNumber(row.rowCount)}
                        </td>
                        <td className="num py-2.5 text-right text-muted-foreground">
                          {formatDate(
                            row.importedAt.toISOString().slice(0, 10),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </article>
      </div>
    </PageShell>
  );
}
