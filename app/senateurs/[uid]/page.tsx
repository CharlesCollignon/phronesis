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
  getDeputeStats,
  getDeputeVotes,
  getSenateur,
  listGroupesEffectifs,
} from "@/lib/queries";
import { couleurGroupe } from "@/lib/spectre-groupes";
import { urlPhotoSenateur, urlSenateurSenat } from "@/lib/urls";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function SenateurPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const data = await getSenateur(uid);
  if (!data) notFound();

  const { acteur, mandat, groupe } = data;
  const [stats, historique, transparence, groupesSen] =
    await Promise.all([
      getDeputeStats(uid),
      getDeputeVotes(uid, 40),
      getActeurTransparence(uid),
      listGroupesEffectifs("SENAT"),
    ]);
  const ficheOfficielle = urlSenateurSenat(acteur.senatMatricule);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Sénateurs", href: "/senateurs" },
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
            src={urlPhotoSenateur(
              acteur.senatMatricule,
              acteur.prenom,
              acteur.nom,
            )}
            prenom={acteur.prenom}
            nom={acteur.nom}
            size={88}
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Sénat
            </p>
            <h1 className="font-serif text-4xl tracking-tight">
              {nomComplet(acteur.prenom, acteur.nom, acteur.civilite)}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
                  <span>{mandat.circoDepartement}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {ficheOfficielle ? (
            <ExternalLink href={ficheOfficielle}>
              Fiche Sénat
            </ExternalLink>
          ) : null}
          <Link
            href={`/comparateur?type=senateurs&a=${uid}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Comparer avec…
          </Link>
        </div>
      </div>

      <TransparencePanel
        hatvp={transparence.hatvp}
        faits={transparence.faits}
      />

      {groupe ? (
        <section className="mt-8 border border-border bg-card p-4 sm:p-6">
          <h2 className="font-serif text-xl">
            Place dans l&apos;hémicycle
          </h2>
          <div className="mt-4">
            <Hemicycle
              groups={groupesSen}
              chambre="SENAT"
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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat
          label="Amendements"
          value={String(stats.amendementsDeposes)}
        />
        <Stat
          label="Positions"
          value={String(stats.totalVotes)}
          hint="Scrutins publics liés"
        />
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">
          Derniers votes
        </h2>
        <div className="mt-4 overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="sticky left-0 bg-card px-4 py-3 font-medium">
                  Scrutin
                </th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Sort</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((v) => (
                <tr
                  key={v.scrutinUid}
                  className="border-b border-border last:border-0"
                >
                  <td className="sticky left-0 bg-card px-4 py-2.5">
                    <Link
                      href={`/scrutins/${v.scrutinUid}`}
                      className="hover:text-primary hover:underline"
                    >
                      n° {v.numero} — {v.titre}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatDateShort(v.dateScrutin)}
                  </td>
                  <td className="px-4 py-2.5">
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
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatSort(v.sortCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
