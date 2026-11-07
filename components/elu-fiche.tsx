import Link from "next/link";

import { AvatarParlementaire } from "@/components/avatar-parlementaire";
import { GroupeCouleur, couleurDe } from "@/components/groupe-couleur";
import { PageShell, SectionHeading } from "@/components/breadcrumbs";
import { StatsGauges } from "@/components/charts/stats-gauges";
import { libelleCirco } from "@/components/elu-liste";
import { EluVotes, type EluVote } from "@/components/elu-votes";
import { Hemicycle } from "@/components/hemicycle";
import { Stat } from "@/components/stat";
import { TransparencePanel } from "@/components/transparence-panel";
import { formatDate, formatNumber, nomComplet } from "@/lib/format";
import type { GroupeHemicycleInput } from "@/lib/hemicycle";

type EluFicheProps = {
  chambre: "AN" | "SENAT";
  photo: string | null;
  acteur: {
    uid: string;
    prenom: string;
    nom: string;
    civilite: string | null;
    profession: string | null;
  };
  mandat: {
    dateDebut: string | null;
    circoDepartement: string | null;
    circoNum: string | null;
  } | null;
  groupe: {
    uid: string;
    libelle: string;
    libelleAbrege: string | null;
    couleur?: string | null;
  } | null;
  stats: {
    totalVotes: number;
    pour: number;
    contre: number;
    abstention: number;
    nonVotant: number;
    tauxParticipation: number | null;
    fideliteGroupe: number | null;
    amendementsDeposes: number;
    amendementsAdoptes: number;
  };
  historique: EluVote[];
  transparence: React.ComponentProps<typeof TransparencePanel>;
  groupes: GroupeHemicycleInput[];
  ficheOfficielle: { href: string; label: string } | null;
};

function pct(part: number, total: number): string {
  return total > 0 ? `${((100 * part) / total).toFixed(1)}%` : "0%";
}

/** Fiche commune député / sénateur. */
export function EluFiche({
  chambre,
  photo,
  acteur,
  mandat,
  groupe,
  stats,
  historique,
  transparence,
  groupes,
  ficheOfficielle,
}: EluFicheProps): React.ReactElement {
  const isAN = chambre === "AN";
  const nom = nomComplet(acteur.prenom, acteur.nom);
  const feminin = acteur.civilite === "Mme";
  const fonction = isAN
    ? feminin
      ? "Députée"
      : "Député"
    : feminin
      ? "Sénatrice"
      : "Sénateur";
  const exprimes = stats.pour + stats.contre + stats.abstention;
  const circo = isAN
    ? libelleCirco(
        mandat?.circoDepartement ?? null,
        mandat?.circoNum ?? null,
        true,
      )
    : (mandat?.circoDepartement ?? null);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Élus", href: isAN ? "/deputes" : "/senateurs" },
        { label: nom },
      ]}
    >
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col items-start gap-6 sm:flex-row">
          <AvatarParlementaire
            src={photo}
            prenom={acteur.prenom}
            nom={acteur.nom}
            size={96}
            couleur={
              groupe ? couleurDe(groupe.libelleAbrege, groupe.couleur) : null
            }
            className="rise"
          />
          <div className="min-w-0">
            <p className="eyebrow rise" style={{ animationDelay: "40ms" }}>
              {fonction} ·{" "}
              {isAN ? (
                <>
                  17<sup>e</sup> législature
                </>
              ) : (
                "Sénat"
              )}
            </p>
            <h1
              className="rise mt-2.5 text-[clamp(34px,3.8vw,50px)] font-medium leading-[1.08] tracking-[-0.025em]"
              style={{ animationDelay: "80ms" }}
            >
              {nom}
            </h1>
            <dl
              className="rise mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-[15px]"
              style={{ animationDelay: "140ms" }}
            >
              <dt className="text-muted-foreground">Groupe</dt>
              <dd>
                {groupe ? (
                  <Link
                    href={`/groupes/${groupe.uid}`}
                    className="inline-flex items-baseline gap-2"
                  >
                    <GroupeCouleur
                      abrege={groupe.libelleAbrege}
                      couleur={groupe.couleur}
                      className="self-center"
                    />
                    <span className="ln">
                    {groupe.libelle}
                    {groupe.libelleAbrege
                      ? ` (${groupe.libelleAbrege})`
                      : ""}
                    </span>
                  </Link>
                ) : (
                  "Sans groupe"
                )}
              </dd>
              {circo ? (
                <>
                  <dt className="text-muted-foreground">
                    {isAN ? "Circonscription" : "Département"}
                  </dt>
                  <dd>{circo}</dd>
                </>
              ) : null}
              {mandat?.dateDebut ? (
                <>
                  <dt className="text-muted-foreground">Mandat depuis</dt>
                  <dd className="num">{formatDate(mandat.dateDebut)}</dd>
                </>
              ) : null}
              {acteur.profession ? (
                <>
                  <dt className="text-muted-foreground">Profession</dt>
                  <dd>{acteur.profession}</dd>
                </>
              ) : null}
            </dl>
          </div>
        </div>
        <div
          className="rise flex flex-wrap gap-2.5"
          style={{ animationDelay: "200ms" }}
        >
          <Link
            href={`/comparateur?type=${isAN ? "deputes" : "senateurs"}&a=${acteur.uid}`}
            className="btn btn-accent"
          >
            Comparer avec un élu
          </Link>
          {ficheOfficielle ? (
            <a
              href={ficheOfficielle.href}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              {ficheOfficielle.label}
              <span aria-hidden>↗</span>
            </a>
          ) : null}
        </div>
      </div>

      <section className="mt-16 border-t border-foreground pt-7">
        <SectionHeading
          title="Positions de vote"
          aside={
            isAN ? (
              <>
                Scrutins publics de l&apos;Assemblée, 17<sup>e</sup>{" "}
                législature
              </>
            ) : (
              "Scrutins publics du Sénat"
            )
          }
          className="pb-0"
        />
        <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6">
          {[
            [
              exprimes,
              `scrutins avec une position, sur ${formatNumber(stats.totalVotes)} où l'élu apparaît`,
            ],
            [stats.pour, "pour"],
            [stats.contre, "contre"],
            [stats.abstention, stats.abstention > 1 ? "abstentions" : "abstention"],
            [stats.nonVotant, stats.nonVotant > 1 ? "non-votants" : "non-votant"],
          ].map(([value, label]) => (
            <div key={String(label)}>
              <p className="num text-[clamp(28px,3vw,36px)] font-medium leading-none tracking-[-0.02em]">
                {formatNumber(Number(value))}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div
          className="mt-6 flex h-2.5 gap-0.5 bg-[var(--vote-neutre)]"
          role="img"
          aria-label={`Répartition : ${stats.pour} pour, ${stats.contre} contre, ${stats.abstention} abstentions`}
        >
          {exprimes > 0 ? (
            <>
              <span
                className="grow-x block bg-[var(--vote-pour)]"
                style={{ width: pct(stats.pour, exprimes) }}
              />
              <span
                className="grow-x block bg-[var(--vote-contre)]"
                style={{
                  width: pct(stats.contre, exprimes),
                  animationDelay: "120ms",
                }}
              />
              <span
                className="grow-x block bg-[var(--vote-abstention)]"
                style={{
                  width: pct(stats.abstention, exprimes),
                  animationDelay: "240ms",
                }}
              />
            </>
          ) : null}
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Noir : pour · gris : contre · clair : abstention
        </p>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#404040] dark:text-muted-foreground">
          À lire avec prudence : la grande majorité des scrutins publics
          portent sur des amendements, souvent votés par quelques dizaines
          {isAN ? " de députés présents" : " de sénateurs présents"}. Un
          faible nombre de positions ne dit rien, à lui seul, du travail
          parlementaire.
        </p>
      </section>

      <div className="flex flex-wrap items-start gap-x-14 gap-y-16 pt-16">
        <div className="min-w-0 flex-[2_1_600px]">
          <SectionHeading title="Participation et cohésion" />
          <StatsGauges
            participation={stats.tauxParticipation}
            fidelite={stats.fideliteGroupe}
          />
          <div className="mt-10 grid grid-cols-2 gap-6">
            <Stat
              label="Amendements déposés"
              value={formatNumber(stats.amendementsDeposes)}
            />
            <Stat
              label="Amendements adoptés"
              value={formatNumber(stats.amendementsAdoptes)}
            />
          </div>
          <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
            Méthode : participation = votes hors non-votants / scrutins
            publics où {isAN ? "le député" : "le sénateur"} apparaît.
            Fidélité = accord avec la position majoritaire de son groupe
            (pour/contre/abstention). Une participation faible peut tenir
            au grand nombre de scrutins sur amendements, tenus en séance
            avec peu d&apos;élus présents. Voir la{" "}
            <Link href="/methodologie" className="ln text-foreground">
              méthodologie
            </Link>
            .
          </p>
        </div>

        <aside className="min-w-0 flex-[1_1_300px] space-y-12">
          <TransparencePanel {...transparence} />
          {groupe ? (
            <section className="border-t border-foreground pt-5">
              <h2 className="eyebrow">Place dans l&apos;hémicycle</h2>
              <Hemicycle
                groups={groupes}
                chambre={chambre}
                selectedUid={groupe.uid}
                compact
                className="mt-4"
              />
            </section>
          ) : null}
        </aside>
      </div>

      <EluVotes
        votes={historique}
        title={isAN ? "Votes récents" : "Derniers votes"}
      />
    </PageShell>
  );
}
