import Link from "next/link";

import { Badge } from "@/components/badge";
import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { FilterTabs } from "@/components/filter-tabs";
import { SearchForm } from "@/components/search-form";
import { VoteBar } from "@/components/vote-bar";
import {
  capitalizeTitre,
  formatDateShort,
  formatNumber,
  formatSort,
} from "@/lib/format";
import { listScrutins } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    chambre?: string;
    resultat?: string;
    type?: string;
  }>;
};

const RESULTATS = [
  ["all", "Tous"],
  ["adopte", "Adoptés"],
  ["rejete", "Rejetés"],
] as const;

const TYPES = [
  ["all", "Tous types"],
  ["ensemble", "Ensemble d'un texte"],
  ["amendement", "Amendements"],
] as const;

const CHAMBRES = [
  ["all", "Toutes"],
  ["AN", "Assemblée nationale"],
  ["SENAT", "Sénat"],
] as const;

const COLS =
  "md:grid-cols-[80px_100px_minmax(0,1fr)_92px_200px]";

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
  const resultat =
    params.resultat === "adopte" || params.resultat === "rejete"
      ? params.resultat
      : "all";
  const type =
    params.type === "ensemble" || params.type === "amendement"
      ? params.type
      : "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const limit = 40;
  const rows = await listScrutins({
    search: q,
    limit,
    offset: (page - 1) * limit,
    chambre,
    resultat,
    type,
  });

  const qs = (
    p: number,
    ch: string = chambre,
    res: string = resultat,
    ty: string = type,
  ) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (ch !== "all") sp.set("chambre", ch);
    if (res !== "all") sp.set("resultat", res);
    if (ty !== "all") sp.set("type", ty);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/scrutins?${s}` : "/scrutins";
  };

  const first = (page - 1) * limit + 1;
  const last = (page - 1) * limit + rows.length;

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Votes" },
      ]}
    >
      <PageHeader
        title="Votes"
        description="Scrutins publics nominatifs à l'Assemblée nationale et au Sénat. Chaque position de chaque parlementaire, scrutin par scrutin."
      />

      <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
        <FilterTabs
          variant="segmented"
          label="Chambre"
          activeId={chambre}
          className="max-w-full overflow-x-auto"
          tabs={CHAMBRES.map(([id, label]) => ({
            id,
            label,
            href: qs(1, id),
          }))}
        />
        <div className="min-w-0 flex-[1_1_300px]">
          <SearchForm
            action="/scrutins"
            defaultValue={q}
            placeholder="Rechercher dans l'objet des scrutins…"
            hidden={{
              ...(chambre !== "all" ? { chambre } : {}),
              ...(resultat !== "all" ? { resultat } : {}),
              ...(type !== "all" ? { type } : {}),
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <FilterTabs
          label="Résultat"
          activeId={resultat}
          tabs={RESULTATS.map(([id, label]) => ({
            id,
            label,
            href: qs(1, chambre, id, type),
          }))}
        />
        <span aria-hidden className="hidden h-[18px] w-px bg-border sm:block" />
        <FilterTabs
          label="Type de scrutin"
          activeId={type}
          tabs={TYPES.map(([id, label]) => ({
            id,
            label,
            href: qs(1, chambre, resultat, id),
          }))}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border pb-2">
        <p className="text-[15px] text-muted-foreground">
          {q ? (
            <>
              Résultats pour{" "}
              <span className="text-foreground">« {q} »</span>
              {" · "}
              <Link
                href={(() => {
                  const sp = new URLSearchParams();
                  if (chambre !== "all") sp.set("chambre", chambre);
                  if (resultat !== "all") sp.set("resultat", resultat);
                  if (type !== "all") sp.set("type", type);
                  const s = sp.toString();
                  return s ? `/scrutins?${s}` : "/scrutins";
                })()}
                className="ln text-foreground"
              >
                Effacer
              </Link>
            </>
          ) : (
            "Du plus récent au plus ancien"
          )}
        </p>
        <p className="num text-sm text-muted-foreground">
          {rows.length > 0
            ? `${formatNumber(first)}–${formatNumber(last)} · page ${page}`
            : `page ${page}`}
        </p>
      </div>

      {rows.length > 0 ? (
        <>
          <div
            className={`hidden gap-5 px-2 pb-3 pt-3 text-[13px] text-muted-foreground md:grid ${COLS}`}
          >
            <span>Numéro</span>
            <span>Date</span>
            <span>Objet</span>
            <span>Résultat</span>
            <span>Pour · contre · abst.</span>
          </div>
          <ul className="border-b border-border">
            {rows.map((s, i) => {
              const adopte = s.sortCode.toLowerCase().includes("adopt");
              const chambreLabel =
                s.chambre === "SENAT" ? "Sénat" : "Assemblée nationale";
              return (
                <li key={s.uid}>
                  <Link
                    href={`/scrutins/${s.uid}`}
                    className={`row-link rise grid grid-cols-[minmax(0,1fr)_84px] items-center gap-5 border-t border-border px-2 py-4 ${COLS}`}
                    style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                  >
                    <span className="num hidden text-sm text-[#404040] md:block dark:text-muted-foreground">
                      {formatNumber(s.numero)}
                    </span>
                    <span className="num hidden text-sm text-muted-foreground md:block">
                      {formatDateShort(s.dateScrutin)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base leading-snug">
                        {capitalizeTitre(s.titre)}
                      </span>
                      <span className="mt-1 block text-[13px] text-muted-foreground">
                        <span className="num md:hidden">
                          n° {formatNumber(s.numero)} ·{" "}
                          {formatDateShort(s.dateScrutin)} ·{" "}
                        </span>
                        {chambreLabel}
                        {s.dossierUid ? " · lié à un dossier" : null}
                      </span>
                    </span>
                    <Badge tone={adopte ? "adopte" : "rejete"}>
                      {formatSort(s.sortCode)}
                    </Badge>
                    <span className="hidden flex-col gap-1.5 md:flex">
                      <VoteBar
                        pour={s.pour ?? 0}
                        contre={s.contre ?? 0}
                        abstentions={s.abstentions ?? 0}
                      />
                      <span className="num text-[13px] text-[#404040] dark:text-muted-foreground">
                        {formatNumber(s.pour ?? 0)} ·{" "}
                        {formatNumber(s.contre ?? 0)} ·{" "}
                        {formatNumber(s.abstentions ?? 0)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-6 text-[15px] text-[#404040] dark:text-muted-foreground">
          Aucun scrutin ne correspond à ces critères.
        </p>
      )}

      {page > 1 || rows.length === limit ? (
        <nav
          aria-label="Pagination"
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          {page > 1 ? (
            <Link href={qs(page - 1)} className="btn btn-outline">
              ← Précédent
            </Link>
          ) : null}
          {rows.length === limit ? (
            <Link href={qs(page + 1)} className="btn btn-outline">
              Suivant →
            </Link>
          ) : null}
        </nav>
      ) : null}

      <p className="mt-7 text-sm text-muted-foreground">
        Les votes à main levée ne sont pas nominatifs et n&apos;apparaissent
        pas ici.
      </p>
    </PageShell>
  );
}
