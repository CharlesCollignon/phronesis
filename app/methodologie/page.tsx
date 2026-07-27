import { ExternalLink } from "@/components/external-link";
import { PageShell } from "@/components/breadcrumbs";
import { formatDate, formatNumber } from "@/lib/format";
import { getImportHistory } from "@/lib/queries";
import { urlOpenDataAn, urlOpenDataSenat } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Méthodologie",
};

export default async function MethodologiePage(): Promise<React.ReactElement> {
  const history = await getImportHistory();

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Méthodologie" },
      ]}
    >
      <div className="max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Méthodologie
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
        Phronesis n&apos;oriente pas le jugement. Cette page documente
        d&apos;où viennent les données, comment chaque chiffre est
        calculé, et ce que les sources ne permettent pas de dire.
      </p>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Sources
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Open data de l&apos;Assemblée nationale —{" "}
            <ExternalLink href={urlOpenDataAn()}>
              data.assemblee-nationale.fr
            </ExternalLink>
            , licence ouverte. Jeux : AMO (acteurs/organes), dossiers,
            scrutins, amendements (17<sup>e</sup> législature).
          </li>
          <li>
            Open data du Sénat —{" "}
            <ExternalLink href={urlOpenDataSenat()}>
              data.senat.fr
            </ExternalLink>
            : ODSEN (matricules sénateurs) et Dosleg (scrutins publics
            et votes nominatifs depuis 2006).
          </li>
          <li>
            Les sénateurs AMO sont reliés aux votes Dosleg par
            appariement nominatif du matricule ODSEN (les non-appariés
            sont exclus des votes).
          </li>
          <li>
            Chaque fiche renvoie vers la page officielle
            (assemblee-nationale.fr ou senat.fr).
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Limite essentielle : scrutins publics uniquement
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          La majorité des votes en séance se font à main levée et ne
          produisent aucune trace nominative. Phronesis n&apos;affiche
          donc que les <strong>scrutins publics</strong>. Quand un
          dossier n&apos;a aucun scrutin lié, cela ne signifie pas
          qu&apos;il n&apos;a pas été voté — seulement que le vote
          n&apos;était pas nominatif dans les données ouvertes.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Calcul des statistiques députés
        </h2>
        <dl className="mt-4 space-y-4 text-sm leading-relaxed">
          <div>
            <dt className="font-semibold">Participation</dt>
            <dd className="text-[var(--muted)]">
              (nombre de positions hors « non-votant ») / (nombre de
              scrutins publics où le député apparaît dans le décompte
              nominatif).
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Fidélité au groupe</dt>
            <dd className="text-[var(--muted)]">
              Pour chaque scrutin où le député a une position
              pour/contre/abstention et un groupe renseigné : on
              calcule la position majoritaire du groupe, puis on
              compte l&apos;accord. Les non-votants sont exclus du
              calcul.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Amendements</dt>
            <dd className="text-[var(--muted)]">
              Comptage des amendements où le député est auteur
              principal, et de ceux dont le sort contient « adopt ».
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Comparateur
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Pour deux députés : on ne retient que les scrutins publics
          où les deux ont une position pour, contre ou abstention. Le
          taux d&apos;accord est le ratio accords / scrutins ainsi
          comparés. Les non-votants sont exclus du dénominateur et
          indiqués à part. Pour deux groupes : on prend d&apos;abord
          la position majoritaire de chaque groupe (mode statistique)
          sur chaque scrutin, puis la même logique d&apos;accord.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Score Phronesis (SCORE_PHRONESIS_V1)
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Score déterministe de <strong>robustesse documentaire</strong>
          , jamais une note morale sur la loi. Total sur 100 points :
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
          <li>Documents liés — 20</li>
          <li>Diversité des types de documents — 15</li>
          <li>Actes procéduraux — 20</li>
          <li>Scrutins publics liés — 15</li>
          <li>Amendements — 10</li>
          <li>Résumé de vulgarisation — 10</li>
          <li>Empreinte civique — 10</li>
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Des paliers partiels s&apos;appliquent (ex. moins de points
          s&apos;il n&apos;y a qu&apos;un type de document ou peu
          d&apos;actes). Le détail des critères est affiché sur chaque
          fiche dossier.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Empreinte civique
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Empreinte <strong>qualitative</strong> : aucun score
          numérique par axe. Pour chacun des dix axes (liberté,
          égalité, sécurité, vie privée, solidarité, responsabilité
          individuelle, État de droit, efficacité économique,
          durabilité, souveraineté), un impact parmi : renforce,
          restreint, mitigé, non abordé, indéterminé — avec
          justification et sources. Générée hors ligne (batch IA),
          stockée avec modèle et version de prompt. L&apos;IA ne
          tranche jamais « bonne » ou « mauvaise » loi.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Résumés IA
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Les résumés sont générés hors ligne (batch), stockés avec le
          modèle, la version du prompt et les sources utilisées. Ils
          sont toujours présentés dans un encadré distinct de la
          « version officielle ». L&apos;IA ne produit pas de jugement
          moral ni de recommandation de vote.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Boussole Phronesis
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Questionnaire de dilemmes (pas de question gauche/droite).
          Chaque dilemme expose un <strong>contexte</strong> et un{" "}
          <strong>enjeu</strong>, puis propose{" "}
          <strong>4 réponses graduées</strong> (du pôle A marqué au
          pôle B marqué, avec deux positions intermédiaires). Chaque
          choix pondère des axes de valeurs. Le profil est normalisé
          puis comparé par similarité cosinus à des conceptions
          philosophiques de référence. Les réponses restent dans le
          navigateur (localStorage) — aucun compte.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Conceptions philosophiques
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Six profils de référence (libéralisme, républicanisme,
          socialisme démocratique, écologie politique,
          conservatisme, libertarisme) sont présentés sur des
          fiches dédiées (<code>/philosophies</code>). Ce sont des
          idéal-types sur les axes de la Boussole — pas des partis.
          Le glossaire des dix axes y est également publié.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Résonance valeurs (Boussole ↔ Empreinte)
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Sur une fiche dossier (et plus tard un groupe), si vous
          avez rempli la Boussole, Phronesis peut afficher une{" "}
          <strong>résonance</strong> : proximité cosinus entre votre
          profil et une projection de l&apos;empreinte qualitative.
          Ce n&apos;est <strong>pas</strong> le Score Phronesis
          (robustesse documentaire) et ce n&apos;est pas un jugement
          moral sur la loi.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
          <li>
            Mapping explicite Empreinte → Boussole (ex. durabilité →
            écologie ; efficacité économique → marché ; sécurité →
            autorité, avec prudence).
          </li>
          <li>
            Projection : renforce = +1, restreint = −1, mitigé = 0 ;
            non abordé / indéterminé exclus.
          </li>
          <li>
            Axes Empreinte sans mapping fiable (État de droit,
            souveraineté) restent dans l&apos;empreinte mais sont
            exclus de la résonance.
          </li>
          <li>
            La couverture (« N axes comparés ») est toujours
            affichée.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Empreinte agrégée des groupes
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Pour un groupe parlementaire (AN ou Sénat), Phronesis
          agrège les empreintes des dossiers liés aux scrutins où le
          groupe a une majorité pour ou contre : le vecteur est
          ajouté (pour) ou inversé (contre), puis normalisé. Limites
          : scrutins publics seulement ; dossiers sans empreinte
          exclus ; majorité ≠ unanimité. Aucun score philosophique
          n&apos;est calculé au niveau d&apos;un élu.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Transparence (HATVP et décisions définitives)
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Sur les fiches député et sénateur uniquement, un bloc
          minimal « Transparence » peut afficher :
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
          <li>
            un lien vers la{" "}
            <strong>fiche nominative HATVP</strong> (déclarations
            publiques d&apos;intérêts / patrimoine selon le droit
            applicable), issu du CSV open data HATVP. Appariement
            strict : député via <code>id_origine</code> →{" "}
            <code>PA…</code> ; sénateur via matricule Sénat. En cas
            d&apos;échec ou d&apos;ambiguïté, aucun lien n&apos;est
            affiché (pas de mention négative).
          </li>
          <li>
            d&apos;éventuelles{" "}
            <strong>décisions judiciaires publiques définitives</strong>
            , curatées manuellement dans un fichier versionné — jamais
            scrapées depuis la presse, jamais issues du casier
            judiciaire (non public).
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed">
          Critères pour ajouter une décision : condamnation
          définitive ; source officielle nominative ; exclusion des
          procédures en cours, non-lieux, relaxes et mises en examen.
          L&apos;absence d&apos;entrée signifie seulement « aucune
          décision définitive référencée dans Phronesis »,{" "}
          <strong>pas</strong> « casier vierge ». Aucun score
          d&apos;intégrité n&apos;est calculé.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Hors périmètre (pour l&apos;instant)
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
          <li>Légifrance, Conseil constitutionnel</li>
          <li>Profil philosophique par élu (député / sénateur)</li>
          <li>Casier judiciaire / affaires en cours / agrégats presse</li>
          <li>Diffs d&apos;amendements sur le texte</li>
          <li>Notifications push, chat, votes sur scrutins</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Compte optionnel (Clerk)
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          La consultation des données open data reste possible sans
          compte. Un compte (Google ou autres providers activés dans
          Clerk) permet de sauvegarder la Boussole et de participer
          aux sondages d&apos;opinion sur les dossiers.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Sondage citoyen sur les lois
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Sur chaque fiche dossier, les utilisateurs connectés peuvent
          indiquer <strong>pour</strong>, <strong>contre</strong> ou{" "}
          <strong>pas d&apos;avis</strong>. C&apos;est un sondage
          d&apos;opinion Phronesis — jamais un scrutin parlementaire.
          Un avis par utilisateur et par dossier, modifiable.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Sondage citoyen sur les scrutins
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          Sur chaque fiche scrutin public, les utilisateurs connectés
          peuvent indiquer <strong>pour</strong>,{" "}
          <strong>contre</strong>, <strong>abstention</strong> ou{" "}
          <strong>pas d&apos;avis</strong>. L&apos;interface compare
          visuellement le décompte officiel des députés au sondage
          citoyen Phronesis — toujours distinct d&apos;un vote
          parlementaire.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Fil « À l&apos;Assemblée »
        </h2>
        <p className="mt-4 text-sm leading-relaxed">
          L&apos;actualité affichée sur l&apos;accueil et la page{" "}
          <code className="text-xs">/actualite</code> est dérivée des
          dossiers et scrutins publics déjà en base. Ce n&apos;est pas
          un agrégateur presse ni un fil de réseaux sociaux.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Historique des imports
        </h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Aucun import enregistré.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Jeu</th>
                  <th className="px-4 py-3 font-medium">Lignes</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="px-4 py-2.5">{row.dataset}</td>
                    <td className="px-4 py-2.5">
                      {formatNumber(row.rowCount)}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--muted)]">
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
      </div>
    </PageShell>
  );
}
