import Link from "next/link";

import { Badge } from "@/components/badge";
import { PageShell } from "@/components/breadcrumbs";
import { FilterTabs } from "@/components/filter-tabs";
import { VoteBar } from "@/components/vote-bar";
import { capitalizeTitre, formatDateShort, formatSort } from "@/lib/format";
import { listScrutins } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    chambre?: string;
  }>;
};

export default async function ScrutinsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const q = params.q ?? "";
  const chambreRaw = params.chambre ?? "all";
  const chambre =
    chambreRaw === "AN" || chambreRaw === "SENAT"
      ? chambreRaw
      : "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const limit = 40;
  const rows = await listScrutins({
    search: q,
    limit,
    offset: (page - 1) * limit,
    chambre,
  });

  const qs = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (chambre !== "all") sp.set("chambre", chambre);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/scrutins?${s}` : "/scrutins";
  };

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Votes" },
      ]}
    >
      <h1 className="font-serif text-4xl tracking-tight">
        Scrutins publics
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Positions nominatives — Assemblée nationale et Sénat. Les
        votes à main levée ne figurent pas dans ces données.
      </p>

      <div className="mt-6">
        <FilterTabs
          activeId={chambre}
          tabs={(
            [
              ["all", "Toutes"],
              ["AN", "Assemblée"],
              ["SENAT", "Sénat"],
            ] as const
          ).map(([id, label]) => ({
            id,
            label,
            href: q
              ? `/scrutins?chambre=${id}&q=${encodeURIComponent(q)}`
              : `/scrutins?chambre=${id}`,
          }))}
        />
      </div>

      <div className="mt-4 max-w-xl">
        <form action="/scrutins" method="get" className="flex gap-2">
          {chambre !== "all" ? (
            <input type="hidden" name="chambre" value={chambre} />
          ) : null}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Filtrer les scrutins…"
            className="w-full flex-1 border border-input bg-input px-4 py-3 text-sm text-foreground outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className=" bg-foreground px-5 py-3 text-sm font-medium text-[var(--background)]"
          >
            Filtrer
          </button>
        </form>
      </div>

      <ul className="mt-8 space-y-3">
        {rows.map((s) => (
          <li key={s.uid}>
            <Link
              href={`/scrutins/${s.uid}`}
              className="block border border-border bg-card p-4 transition hover:border-[var(--accent)]/40"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge tone="neutral">
                  {s.chambre === "SENAT" ? "Sénat" : "AN"}
                </Badge>
                <span>n° {s.numero}</span>
                <span>·</span>
                <span>{formatDateShort(s.dateScrutin)}</span>
                <Badge
                  tone={
                    s.sortCode.toLowerCase().includes("adopt")
                      ? "adopte"
                      : "rejete"
                  }
                >
                  {formatSort(s.sortCode)}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-snug">
                {capitalizeTitre(s.titre)}
              </p>
              <div className="mt-3 max-w-md">
                <VoteBar
                  pour={s.pour ?? 0}
                  contre={s.contre ?? 0}
                  abstentions={s.abstentions ?? 0}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex gap-3">
        {page > 1 ? (
          <Link
            href={qs(page - 1)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            ← Précédent
          </Link>
        ) : null}
        {rows.length === limit ? (
          <Link
            href={qs(page + 1)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Suivant →
          </Link>
        ) : null}
      </div>
    </PageShell>
  );
}
