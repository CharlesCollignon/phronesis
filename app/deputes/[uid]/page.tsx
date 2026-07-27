import Link from "next/link";
import { notFound } from "next/navigation";

import { AvatarParlementaire } from "@/components/avatar-parlementaire";
import { Badge } from "@/components/badge";
import { PageShell } from "@/components/breadcrumbs";
import { StatsGauges } from "@/components/charts/stats-gauges";
import { ExternalLink } from "@/components/external-link";
import { Hemicycle } from "@/components/hemicycle";
import { Stat } from "@/components/stat";
import { TransparencePanel } from "@/components/transparence-panel";
import {
  formatDateShort,
  formatPosition,
  formatSort,
  nomComplet,
} from "@/lib/format";
import {
  getActeurTransparence,
  getDepute,
  getDeputeStats,
  getDeputeVotes,
  listGroupesEffectifs,
} from "@/lib/queries";
import { couleurGroupe } from "@/lib/spectre-groupes";
import { urlDeputeAn, urlPhotoDepute } from "@/lib/urls";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function DeputePage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const data = await getDepute(uid);
  if (!data) notFound();

  const { acteur, mandat, groupe } = data;
  const [stats, historique, transparence, groupesAn] =
    await Promise.all([
      getDeputeStats(uid),
      getDeputeVotes(uid, 40),
      getActeurTransparence(uid),
      listGroupesEffectifs("AN"),
    ]);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Députés", href: "/deputes" },
        {
          label: nomComplet(
            acteur.prenom,
            acteur.nom,
            acteur.civilite,
          ),
        },
      ]}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <AvatarParlementaire
            src={urlPhotoDepute(uid)}
            prenom={acteur.prenom}
            nom={acteur.nom}
            size={88}
          />
          <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
            {nomComplet(acteur.prenom, acteur.nom, acteur.civilite)}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            {groupe ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5"
                  style={{
                    background: couleurGroupe(
                      groupe.libelleAbrege,
                      groupe.couleur,
                    ),
                  }}
                />
                {groupe.libelleAbrege ?? groupe.libelle}
              </span>
            ) : (
              <span>Sans groupe</span>
            )}
            {mandat?.circoDepartement ? (
              <>
                <span>·</span>
                <span>
                  {mandat.circoDepartement}
                  {mandat.circoNum ? ` — ${mandat.circoNum}` : ""}
                </span>
              </>
            ) : null}
          </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <ExternalLink href={urlDeputeAn(uid)}>
            Fiche Assemblée nationale
          </ExternalLink>
          <Link
            href={`/comparateur?type=deputes&a=${uid}`}
            className="text-sm font-medium text-[var(--accent-ink)] hover:underline"
          >
            Comparer avec…
          </Link>
        </div>
      </div>

      {acteur.profession ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Profession : {acteur.profession}
        </p>
      ) : null}

      <TransparencePanel
        hatvp={transparence.hatvp}
        faits={transparence.faits}
      />

      {groupe ? (
        <section className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Place dans l&apos;hémicycle
          </h2>
          <div className="mt-4">
            <Hemicycle
              groups={groupesAn}
              chambre="AN"
              selectedUid={groupe.uid}
              compact
            />
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <StatsGauges
          participation={stats.tauxParticipation}
          fidelite={stats.fideliteGroupe}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Amendements déposés"
          value={String(stats.amendementsDeposes)}
        />
        <Stat
          label="Amendements adoptés"
          value={String(stats.amendementsAdoptes)}
        />
        <Stat label="Pour" value={String(stats.pour)} />
        <Stat label="Contre" value={String(stats.contre)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Abstentions" value={String(stats.abstention)} />
        <Stat label="Non-votants" value={String(stats.nonVotant)} />
      </div>

      <p className="mt-4 text-xs text-[var(--muted)]">
        Méthode : participation = votes hors non-votants / scrutins
        publics où le député apparaît. Fidélité = accord avec la
        position majoritaire de son groupe (pour/contre/abstention).
        Voir{" "}
        <Link href="/methodologie" className="underline">
          méthodologie
        </Link>
        .
      </p>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Historique des votes
        </h2>
        <ul className="mt-4 space-y-2">
          {historique.map((v) => (
            <li key={v.scrutinUid}>
              <Link
                href={`/scrutins/${v.scrutinUid}`}
                className="flex flex-wrap items-start justify-between gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:border-[var(--accent)]/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--muted)]">
                    {formatDateShort(v.dateScrutin)} · n° {v.numero} ·{" "}
                    {formatSort(v.sortCode)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm">{v.titre}</p>
                </div>
                <Badge
                  tone={
                    v.position === "pour"
                      ? "pour"
                      : v.position === "contre"
                        ? "contre"
                        : v.position === "abstention"
                          ? "abstention"
                          : "neutral"
                  }
                >
                  {formatPosition(v.position)}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
