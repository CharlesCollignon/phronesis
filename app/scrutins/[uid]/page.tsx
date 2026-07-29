import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Badge } from "@/components/badge";
import { PageShell } from "@/components/breadcrumbs";
import { ScrutinCharts } from "@/components/charts/scrutin-charts";
import { ExternalLink } from "@/components/external-link";
import { SondageScrutin } from "@/components/sondage-scrutin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VoteBar } from "@/components/vote-bar";
import { VoteFilters } from "@/components/vote-filters";
import {
  formatDate,
  formatNumber,
  formatPosition,
  formatSort,
  capitalizeTitre,
  nomComplet,
} from "@/lib/format";
import { getScrutin, getScrutinVotes } from "@/lib/queries";
import {
  couleurGroupe,
  sortGroupesSpectre,
} from "@/lib/spectre-groupes";
import { urlScrutinAn, urlScrutinSenat } from "@/lib/urls";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uid: string }>;
  searchParams: Promise<{ position?: string; groupe?: string }>;
};

export default async function ScrutinPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const filters = await searchParams;
  const data = await getScrutin(uid);
  if (!data) notFound();

  const { scrutin, dossier, parGroupe } = data;
  const chambre: "AN" | "SENAT" =
    scrutin.chambre === "SENAT" ? "SENAT" : "AN";
  const groupesOrdonnes = sortGroupesSpectre(
    parGroupe.map((g) => ({
      ...g,
      libelleAbrege: g.libelleAbrege,
    })),
    chambre,
  );
  const voteRows = await getScrutinVotes(
    uid,
    filters.position,
    filters.groupe,
  );

  const positionCounts = {
    pour: scrutin.pour ?? 0,
    contre: scrutin.contre ?? 0,
    abstention: scrutin.abstentions ?? 0,
    nonVotant: scrutin.nonVotants ?? 0,
  };

  const chambreLabel =
    scrutin.chambre === "SENAT" ? "Sénat" : "Assemblée";

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Votes", href: "/scrutins" },
        { label: `Scrutin n° ${scrutin.numero}` },
      ]}
    >
      <p className="text-sm text-muted-foreground">
        {chambreLabel} · {formatDate(scrutin.dateScrutin)}
      </p>
      <h1 className="mt-1 max-w-4xl font-serif text-2xl leading-tight tracking-tight sm:text-3xl">
        {capitalizeTitre(scrutin.titre)}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{chambreLabel}</Badge>
        <Badge
          tone={
            scrutin.sortCode.toLowerCase().includes("adopt")
              ? "adopte"
              : "rejete"
          }
        >
          {formatSort(scrutin.sortCode)}
        </Badge>
        {scrutin.typeVoteLibelle ? (
          <span className="text-sm text-muted-foreground">
            {scrutin.typeVoteLibelle}
          </span>
        ) : null}
        {scrutin.chambre === "SENAT" ? (
          <ExternalLink
            href={urlScrutinSenat(
              scrutin.legislature,
              scrutin.numero,
            )}
          >
            Source Sénat
          </ExternalLink>
        ) : (
          <ExternalLink
            href={urlScrutinAn(scrutin.legislature, scrutin.numero)}
          >
            Source AN
          </ExternalLink>
        )}
      </div>

      {dossier ? (
        <p className="mt-3 text-sm">
          Dossier :{" "}
          <Link
            href={`/dossiers/${dossier.uid}`}
            className="text-primary hover:underline"
          >
            {dossier.titre}
          </Link>
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-border border border-border bg-card sm:grid-cols-4 sm:divide-y-0">
        {(
          [
            ["Pour", scrutin.pour],
            ["Contre", scrutin.contre],
            ["Abstentions", scrutin.abstentions],
            ["Non-votants", scrutin.nonVotants],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-2 px-3 py-2 sm:justify-start sm:gap-3"
          >
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <span className="num text-lg font-medium tabular-nums">
              {formatNumber(value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <VoteBar
          pour={scrutin.pour ?? 0}
          contre={scrutin.contre ?? 0}
          abstentions={scrutin.abstentions ?? 0}
        />
      </div>

      <div className="mt-8">
        <SondageScrutin
          scrutinUid={scrutin.uid}
          deputesPour={scrutin.pour ?? 0}
          deputesContre={scrutin.contre ?? 0}
          deputesAbstention={scrutin.abstentions ?? 0}
        />
      </div>

      <section className="mt-10">
        <ScrutinCharts parGroupe={groupesOrdonnes} />
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl">
          Répartition par groupe
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {groupesOrdonnes.map((g) => (
            <li
              key={g.groupeUid ?? "sans-groupe"}
              className="border border-border bg-card p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex h-6 min-w-6 items-center justify-center text-[10px] font-semibold text-white"
                  style={{
                    background: couleurGroupe(
                      g.libelleAbrege,
                      g.couleur,
                    ),
                  }}
                >
                  {(g.libelleAbrege ?? "?").slice(0, 4)}
                </span>
                <span className="text-sm font-medium">
                  {g.libelle ?? "Groupe inconnu"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {g.pour} pour · {g.contre} contre ·{" "}
                  {g.abstention} abs.
                </span>
              </div>
              <div className="mt-2">
                <VoteBar
                  pour={g.pour}
                  contre={g.contre}
                  abstentions={g.abstention}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl">
          Positions nominatives
        </h2>
        <div className="mt-3">
          <Suspense fallback={null}>
            <VoteFilters
              positions={[
                {
                  value: "pour",
                  label: "Pour",
                  count: positionCounts.pour,
                },
                {
                  value: "contre",
                  label: "Contre",
                  count: positionCounts.contre,
                },
                {
                  value: "abstention",
                  label: "Abstention",
                  count: positionCounts.abstention,
                },
                {
                  value: "nonVotant",
                  label: "Non-votant",
                  count: positionCounts.nonVotant,
                },
              ]}
              groupes={parGroupe.map((g) => ({
                uid: g.groupeUid,
                label: g.libelleAbrege ?? g.libelle ?? "?",
              }))}
            />
          </Suspense>
        </div>
        <div className="mt-3 border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="px-4">Député</TableHead>
                <TableHead className="px-4">Groupe</TableHead>
                <TableHead className="px-4">Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voteRows.map((v) => (
                <TableRow key={v.acteurUid}>
                  <TableCell className="px-4">
                    <Link
                      href={
                        scrutin.chambre === "SENAT"
                          ? `/senateurs/${v.acteurUid}`
                          : `/deputes/${v.acteurUid}`
                      }
                      className="hover:text-primary"
                    >
                      {nomComplet(v.prenom, v.nom)}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {v.groupeLibelle ?? "—"}
                  </TableCell>
                  <TableCell className="px-4">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </PageShell>
  );
}
