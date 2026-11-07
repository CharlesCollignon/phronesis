import Link from "next/link";

import { SectionHeading } from "@/components/breadcrumbs";
import { capitalizeTitre, formatDateShort } from "@/lib/format";

export type GroupePositionRow = {
  uid: string;
  numero: number;
  dateScrutin: string;
  titre: string;
  sortCode: string;
  pour: number;
  contre: number;
  abstention: number;
  nonVotant: number;
};

/**
 * Positions des membres d'un groupe sur ses derniers votes « sur
 * l'ensemble » d'un texte. Cohésion = part des votants ayant suivi la
 * position majoritaire du groupe.
 */
export function GroupeCohesion({
  rows,
}: {
  rows: GroupePositionRow[];
}): React.ReactElement | null {
  if (rows.length === 0) return null;
  return (
    <section className="pt-20">
      <SectionHeading
        title="Positions sur les textes récents"
        aside="Votes sur l'ensemble d'un texte"
        rule
      />
      <div className="hidden grid-cols-[92px_minmax(0,1fr)_240px_72px] gap-5 px-2 pb-2.5 pt-3 text-[13px] text-muted-foreground md:grid">
        <span>Date</span>
        <span>Texte</span>
        <span>Positions des membres</span>
        <span className="text-right">Cohésion</span>
      </div>
      <ul className="border-b border-border">
        {rows.map((r) => {
          const exprimes = r.pour + r.contre + r.abstention;
          const majorite = Math.max(r.pour, r.contre, r.abstention);
          const cohesion =
            exprimes > 0 ? Math.round((100 * majorite) / exprimes) : null;
          const parts = [
            r.pour ? `${r.pour} pour` : null,
            r.contre ? `${r.contre} contre` : null,
            r.abstention ? `${r.abstention} abst.` : null,
            r.nonVotant ? `${r.nonVotant} n.-v.` : null,
          ].filter(Boolean);
          const w = (n: number): string =>
            exprimes > 0 ? `${(100 * n) / exprimes}%` : "0%";
          return (
            <li key={r.uid}>
              <Link
                href={`/scrutins/${r.uid}`}
                className="row-link grid grid-cols-[minmax(0,1fr)_64px] items-center gap-5 border-t border-border px-2 py-4 md:grid-cols-[92px_minmax(0,1fr)_240px_72px]"
              >
                <span className="num hidden text-sm text-muted-foreground md:block">
                  {formatDateShort(r.dateScrutin)}
                </span>
                <span className="text-base leading-snug">
                  {capitalizeTitre(r.titre)}
                </span>
                <span className="hidden flex-col gap-1.5 md:flex">
                  <span
                    role="img"
                    aria-label={parts.join(", ")}
                    className="grow-x flex h-2 gap-0.5"
                  >
                    {r.pour ? (
                      <span
                        className="bg-[var(--vote-pour)]"
                        style={{ width: w(r.pour) }}
                      />
                    ) : null}
                    {r.contre ? (
                      <span
                        className="bg-[var(--vote-contre)]"
                        style={{ width: w(r.contre) }}
                      />
                    ) : null}
                    {r.abstention ? (
                      <span
                        className="bg-[var(--vote-abstention)]"
                        style={{ width: w(r.abstention) }}
                      />
                    ) : null}
                  </span>
                  <span className="num text-[13px] text-muted-foreground">
                    {parts.join(" · ")}
                  </span>
                </span>
                <span className="num text-right text-[17px]">
                  {cohesion === null ? "—" : `${cohesion} %`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3.5 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
        Cohésion : part des membres votants ayant adopté la position
        majoritaire du groupe. Noir : pour · gris : contre · clair :
        abstention. Les non-votants sont indiqués à part.
      </p>
    </section>
  );
}
