import Link from "next/link";

import { Badge } from "@/components/badge";
import { PageShell } from "@/components/breadcrumbs";
import { FilterTabs } from "@/components/filter-tabs";
import { SearchForm } from "@/components/search-form";
import {
  capitalizeTitre,
  formatDateShort,
  formatNumber,
  formatSort,
  nomComplet,
} from "@/lib/format";
import { searchAll } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Nombre maximal de résultats renvoyés par catégorie (searchAll). */
const PAR_CATEGORIE = 10;

type Categorie = "tous" | "dossiers" | "scrutins" | "deputes";

type PageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

const DIACRITICS = /[̀-ͯ]/g;

function fold(s: string): string {
  return s.normalize("NFD").replace(DIACRITICS, "").toLowerCase();
}

/**
 * Surligne les termes de la requête (insensible aux accents et à la
 * casse ; pluriels simples tolérés, la recherche plein texte étant
 * racinisée).
 */
function Highlight({
  text,
  query,
}: {
  text: string;
  query: string;
}): React.ReactNode {
  const terms = fold(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3)
    .map((t) => (t.length > 4 ? t.replace(/[sx]$/, "") : t));
  if (terms.length === 0) return text;

  // Texte replié caractère par caractère : les index restent alignés.
  const folded = Array.from(text, (c) => fold(c).charAt(0) || c).join("");
  const chars = Array.from(text);
  const marks = new Array<boolean>(chars.length).fill(false);
  for (const term of terms) {
    let from = folded.indexOf(term);
    while (from !== -1) {
      for (let i = from; i < from + term.length; i++) marks[i] = true;
      from = folded.indexOf(term, from + term.length);
    }
  }
  if (!marks.some(Boolean)) return text;

  const out: React.ReactNode[] = [];
  let buf = "";
  let on = marks[0] ?? false;
  const flush = (key: number): void => {
    if (!buf) return;
    out.push(
      on ? (
        <mark
          key={key}
          className="bg-transparent px-px text-inherit [background:linear-gradient(#ffe08a,#ffe08a)_no-repeat_0_85%/100%_45%] dark:[background:linear-gradient(#5c4a10,#5c4a10)_no-repeat_0_85%/100%_45%]"
        >
          {buf}
        </mark>
      ) : (
        buf
      ),
    );
    buf = "";
  };
  chars.forEach((c, i) => {
    const m = marks[i] ?? false;
    if (m !== on) {
      flush(i);
      on = m;
    }
    buf += c;
  });
  flush(chars.length);
  return <>{out}</>;
}

const ROW =
  "row-link grid gap-x-5 gap-y-1 border-t border-border px-2 py-[18px] md:grid-cols-[120px_minmax(0,1fr)_170px] md:items-baseline";

const KIND =
  "hidden text-[13px] font-semibold uppercase tracking-[0.04em] text-muted-foreground md:block";

function GroupHeading({
  title,
  count,
  allHref,
}: {
  title: string;
  count: number;
  allHref: string;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 pb-1.5">
      <h2 className="text-xl font-semibold">
        {title}{" "}
        <span className="num text-base font-normal text-muted-foreground">
          {count >= PAR_CATEGORIE
            ? `${PAR_CATEGORIE} premiers résultats`
            : `${count} résultat${count > 1 ? "s" : ""}`}
        </span>
      </h2>
      <Link href={allHref} className="ln text-sm">
        Tout voir
      </Link>
    </div>
  );
}

export default async function RecherchePage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const categorie: Categorie =
    params.type === "dossiers" ||
    params.type === "scrutins" ||
    params.type === "deputes"
      ? params.type
      : "tous";
  const results = q ? await searchAll(q) : null;

  const total = results
    ? results.dossiers.length + results.scrutins.length + results.deputes.length
    : 0;
  const enc = encodeURIComponent(q);
  const tabHref = (type: Categorie): string =>
    type === "tous" ? `/recherche?q=${enc}` : `/recherche?q=${enc}&type=${type}`;

  const show = (c: Exclude<Categorie, "tous">): boolean =>
    results != null &&
    results[c].length > 0 &&
    (categorie === "tous" || categorie === c);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Recherche" },
      ]}
    >
      <h1 className="sr-only">Recherche</h1>
      <div className="rise mt-2">
        <SearchForm
          size="large"
          defaultValue={q}
          placeholder="Une loi, un scrutin, un élu…"
          hidden={categorie !== "tous" ? { type: categorie } : undefined}
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Recherche plein texte (français) dans les titres des dossiers et des
        scrutins, et dans les noms des députés.
      </p>

      {results ? (
        <>
          <FilterTabs
            label="Type de résultat"
            activeId={categorie}
            className="mt-8 border-b border-border"
            tabs={[
              { id: "tous", label: "Tout", count: total },
              { id: "dossiers", label: "Lois", count: results.dossiers.length },
              {
                id: "scrutins",
                label: "Scrutins",
                count: results.scrutins.length,
              },
              { id: "deputes", label: "Élus", count: results.deputes.length },
            ].map((t) => ({
              id: t.id,
              href: tabHref(t.id as Categorie),
              label: (
                <>
                  {t.label}{" "}
                  <span className="num text-muted-foreground">{t.count}</span>
                </>
              ),
            }))}
          />

          {show("dossiers") ? (
            <section className="reveal mt-9">
              <GroupHeading
                title="Lois"
                count={results.dossiers.length}
                allHref={`/dossiers?q=${enc}`}
              />
              <ul className="border-b border-border">
                {results.dossiers.map((d) => (
                  <li key={d.uid}>
                    <Link href={`/dossiers/${d.uid}`} className={ROW}>
                      <span className={KIND}>Loi</span>
                      <span className="text-[17px] leading-snug">
                        <Highlight text={capitalizeTitre(d.titre)} query={q} />
                      </span>
                      <span className="text-sm text-muted-foreground md:text-right">
                        {d.procedureLibelle}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {show("scrutins") ? (
            <section className="reveal mt-9">
              <GroupHeading
                title="Scrutins"
                count={results.scrutins.length}
                allHref={`/scrutins?q=${enc}`}
              />
              <ul className="border-b border-border">
                {results.scrutins.map((s) => (
                  <li key={s.uid}>
                    <Link href={`/scrutins/${s.uid}`} className={ROW}>
                      <span className={KIND}>Scrutin</span>
                      <span className="text-[17px] leading-snug">
                        <Highlight text={capitalizeTitre(s.titre)} query={q} />
                      </span>
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:flex-col md:items-end">
                        <span className="num text-sm text-muted-foreground">
                          n° {formatNumber(s.numero)} ·{" "}
                          {formatDateShort(s.dateScrutin)}
                        </span>
                        <Badge
                          tone={
                            s.sortCode.toLowerCase().includes("adopt")
                              ? "adopte"
                              : "rejete"
                          }
                        >
                          {formatSort(s.sortCode)}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {show("deputes") ? (
            <section className="reveal mt-9">
              <GroupHeading
                title="Élus"
                count={results.deputes.length}
                allHref={`/deputes?q=${enc}`}
              />
              <ul className="border-b border-border">
                {results.deputes.map((d) => (
                  <li key={d.uid}>
                    <Link href={`/deputes/${d.uid}`} className={ROW}>
                      <span className={KIND}>Élu</span>
                      <span className="text-[17px] leading-snug">
                        <Highlight text={nomComplet(d.prenom, d.nom)} query={q} />
                      </span>
                      <span className="text-sm text-muted-foreground md:text-right">
                        Député · 17<sup>e</sup> législature
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {total === 0 ||
          (categorie !== "tous" && results[categorie].length === 0) ? (
            <div className="reveal mt-10 border border-border p-7">
              <p className="text-lg font-medium">Aucun résultat pour « {q} »</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Essayez un terme plus court, un mot du titre d&apos;un texte
                ou le nom de famille d&apos;un élu.
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
          <span className="text-muted-foreground">Ou parcourir</span>
          <Link href="/dossiers" className="ln">
            Les lois
          </Link>
          <Link href="/scrutins" className="ln">
            Les scrutins
          </Link>
          <Link href="/deputes" className="ln">
            Les élus
          </Link>
        </div>
      )}
    </PageShell>
  );
}
