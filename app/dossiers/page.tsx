import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { FilterTabs } from "@/components/filter-tabs";
import { SearchForm } from "@/components/search-form";
import { capitalizeTitre, formatNumber } from "@/lib/format";
import {
  getHomeStats,
  listDossiers,
  type TypeDossierFiltre,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LIMIT = 40;

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; type?: string }>;
};

const TYPES: [TypeDossierFiltre, string][] = [
  ["all", "Tous"],
  ["lois", "Projets et propositions de loi"],
  ["resolutions", "Résolutions"],
  ["controle", "Contrôle et information"],
];

function parseType(value: string | undefined): TypeDossierFiltre {
  return value === "lois" || value === "resolutions" || value === "controle"
    ? value
    : "all";
}

function pageHref(q: string, page: number, type: TypeDossierFiltre): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type !== "all") params.set("type", type);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/dossiers?${qs}` : "/dossiers";
}

type Impact = { axe: string; impact: string };

/** Dix cases : noir = renforce, contour = restreint, gris = mitigé. */
function EmpreinteStrip({ impacts }: { impacts: Impact[] }): React.ReactElement {
  const n = (k: string): number => impacts.filter((i) => i.impact === k).length;
  const r = n("renforce");
  const x = n("restreint");
  const m = n("mitige") + n("indetermine");
  const cells = [
    ...Array<string>(r).fill("bg-foreground"),
    ...Array<string>(x).fill("shadow-[inset_0_0_0_1.5px_var(--foreground)]"),
    ...Array<string>(m).fill("bg-[var(--vote-contre)]"),
  ];
  while (cells.length < 10) cells.push("bg-[var(--vote-neutre)]");
  const label = `${r} renforce, ${x} restreint, ${m} mitigé ou indéterminé, ${10 - r - x - m} non abordé`;
  return (
    <span role="img" aria-label={label} title={label} className="flex gap-0.5">
      {cells.slice(0, 10).map((c, i) => (
        <span key={i} className={cn("h-4 w-2.5", c)} />
      ))}
    </span>
  );
}

/** Numéros de page à afficher : 1, voisins de la page courante, dernière. */
function pageWindow(current: number, last: number): (number | "…")[] {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= last)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const PG =
  "inline-flex h-10 min-w-10 items-center justify-center border px-2.5 text-sm font-medium transition-colors";

export default async function DossiersPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const type = parseType(params.type);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const [rows, stats] = await Promise.all([
    listDossiers({
      search: q,
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
      type,
    }),
    getHomeStats(),
  ]);

  const total = Number(stats.counts.dossiers);
  // Le nombre total n'est connu que sans recherche ni filtre.
  const filtered = Boolean(q) || type !== "all";
  const lastPage = filtered ? null : Math.max(1, Math.ceil(total / LIMIT));
  const hasNext = lastPage ? page < lastPage : rows.length === LIMIT;
  const first = (page - 1) * LIMIT + 1;

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Lois" },
      ]}
    >
      <PageHeader
        title="Lois"
        description={
          <>
            <span className="num">{formatNumber(total)}</span> dossiers
            législatifs de la 17<sup>e</sup> législature : projets et
            propositions de loi, avec leurs étapes, documents, amendements
            et scrutins, et un accès permanent au texte officiel.
          </>
        }
      />

      <div className="mt-9 max-w-2xl">
        <SearchForm
          action="/dossiers"
          placeholder="Rechercher dans les titres…"
          defaultValue={q}
          hidden={type !== "all" ? { type } : undefined}
        />
      </div>

      <FilterTabs
        className="mt-6"
        label="Type de dossier"
        activeId={type}
        tabs={TYPES.map(([id, label]) => ({
          id,
          label,
          href: pageHref(q, 1, id),
        }))}
      />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-2">
        <p className="text-[15px] font-medium">
          {q ? (
            <>
              Résultats pour « {q} »{" "}
              <Link
                href={pageHref("", 1, type)}
                className="ln ml-2 text-sm font-normal text-muted-foreground"
              >
                Effacer
              </Link>
            </>
          ) : (
            (TYPES.find(([id]) => id === type)?.[1] ?? "Tous les dossiers")
          )}
        </p>
        <p className="num text-sm text-muted-foreground">
          {rows.length === 0
            ? "Aucun dossier"
            : q
              || filtered
              ? `${formatNumber(first)}–${formatNumber(first + rows.length - 1)}`
              : `${formatNumber(first)}–${formatNumber(first + rows.length - 1)} sur ${formatNumber(total)}`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="reveal mt-10 border border-border p-7">
          <p className="text-lg font-medium">
            {q ? `Aucun dossier pour « ${q} »` : "Aucun dossier en base."}
          </p>
          {q ? (
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Essayez un terme plus court ou plus général. La recherche porte
              sur les titres des dossiers.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1fr)_150px_96px_20px] gap-6 px-2 pb-2.5 pt-3 text-[13px] text-muted-foreground md:grid">
            <span>Dossier</span>
            <span>Empreinte civique</span>
            <span>Résumé clair</span>
            <span />
          </div>
          <ul className="border-b border-border">
            {rows.map((d, i) => (
              <li
                key={d.uid}
                className="rise"
                style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              >
                <Link
                  href={`/dossiers/${d.uid}`}
                  className="row-link group grid grid-cols-[minmax(0,1fr)_20px] items-center gap-6 border-t border-border px-2 py-5 md:grid-cols-[minmax(0,1fr)_150px_96px_20px]"
                >
                  <span className="min-w-0">
                    <span className="block text-[17px] font-medium leading-snug">
                      {capitalizeTitre(d.titre)}
                    </span>
                    {d.procedureLibelle ? (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {d.procedureLibelle}
                      </span>
                    ) : null}
                  </span>
                  <span className="hidden md:block">
                    {d.empreinteImpacts.length > 0 ? (
                      <EmpreinteStrip impacts={d.empreinteImpacts} />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        À venir
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm md:block",
                      !d.hasResume && "text-muted-foreground",
                    )}
                  >
                    {d.hasResume ? "Disponible" : "À venir"}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="nudge size-[18px] text-muted-foreground group-hover:text-foreground"
                    strokeWidth={1.8}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {page > 1 || hasNext ? (
        <nav
          aria-label="Pagination"
          className="mt-10 flex flex-wrap items-center gap-1.5"
        >
          {page > 1 ? (
            <Link
              href={pageHref(q, page - 1, type)}
              className={cn(PG, "mr-2 border-border hover:border-foreground")}
            >
              Précédent
            </Link>
          ) : null}
          {lastPage
            ? pageWindow(page, lastPage).map((p, i) =>
                p === "…" ? (
                  <span
                    key={`gap-${i}`}
                    className="px-1.5 text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={pageHref(q, p, type)}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(
                      PG,
                      "num",
                      p === page
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    {formatNumber(p)}
                  </Link>
                ),
              )
            : (
                <span className="num px-2 text-sm text-muted-foreground">
                  Page {formatNumber(page)}
                </span>
              )}
          {hasNext ? (
            <Link
              href={pageHref(q, page + 1, type)}
              className={cn(PG, "ml-2 border-border hover:border-foreground")}
            >
              Suivant
            </Link>
          ) : null}
        </nav>
      ) : null}
    </PageShell>
  );
}
