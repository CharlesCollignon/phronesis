import Link from "next/link";

import { SectionHeading } from "@/components/breadcrumbs";
import {
  ORIENTATIONS,
  THEME_LABELS,
  type Theme,
} from "@/lib/amendements-classement";
import { formatNumber } from "@/lib/format";
import type { VotesParTheme } from "@/lib/votes-par-theme";

/** En deçà, un pourcentage ne dit pas grand-chose. */
const MIN_VOTES = 5;

function Pole({
  label,
  pour,
  contre,
}: {
  label: string;
  pour: number;
  contre: number;
}): React.ReactElement {
  const total = pour + contre;
  const part = total > 0 ? pour / total : null;
  const lisible = total >= MIN_VOTES && part != null;
  return (
    <div className="min-w-0">
      <p className="text-[13px] leading-snug text-muted-foreground">{label}</p>
      {lisible ? (
        <>
          <p className="num mt-1 text-[22px] font-medium leading-none">
            {Math.round(part * 100)} % pour
          </p>
          <span aria-hidden className="mt-2 block h-1.5 bg-current/10">
            <span
              className="block h-full bg-current"
              style={{ width: `${part * 100}%` }}
            />
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatNumber(pour)} pour, {formatNumber(contre)} contre
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          {total === 0
            ? "Aucun vote"
            : `Trop peu de votes (${formatNumber(total)})`}
        </p>
      )}
    </div>
  );
}

/**
 * Votes sur les amendements, par thème : pour chaque thème, la part de
 * votes « pour » sur les amendements qui poussent vers l'un ou l'autre
 * pôle.
 */
export function VotesParThemeSection({
  data,
  sujet,
}: {
  data: VotesParTheme;
  /** « le groupe » ou « la députée » / « le député » */
  sujet: string;
}): React.ReactElement | null {
  const lignes = (Object.entries(ORIENTATIONS) as [Theme, NonNullable<(typeof ORIENTATIONS)[Theme]>][])
    .map(([theme, poles]) => {
      const de = (sens: string) =>
        data.orientations.find((o) => o.theme === theme && o.sens === sens) ?? {
          pour: 0,
          contre: 0,
        };
      return { theme, poles, a: de(poles[0].id), b: de(poles[1].id) };
    })
    .filter((l) => l.a.pour + l.a.contre + l.b.pour + l.b.contre > 0);

  if (lignes.length === 0) return null;

  return (
    <section className="pt-16">
      <SectionHeading title="Votes sur les amendements, par thème" rule />
      <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-[#404040] dark:text-muted-foreground">
        Pour chaque thème, la part de votes « pour » de {sujet} sur les
        amendements qui poussent dans un sens ou dans l&apos;autre (votes
        publics uniquement, abstentions exclues). Les amendements sont
        classés par une IA qui ne connaît ni leur auteur ni son groupe ;{" "}
        {formatNumber(data.amendementsClasses)} amendements votés sont classés
        à ce jour.{" "}
        <Link href="/methodologie#amendements" className="ln text-foreground">
          Méthode
        </Link>
      </p>
      <ul className="mt-8 border-b border-border">
        {lignes.map(({ theme, poles, a, b }) => (
          <li
            key={theme}
            className="grid gap-x-8 gap-y-3 border-t border-border py-5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_minmax(0,1fr)]"
          >
            <p className="text-[15px] font-semibold">{THEME_LABELS[theme]}</p>
            <Pole label={poles[0].label} pour={a.pour} contre={a.contre} />
            <Pole label={poles[1].label} pour={b.pour} contre={b.contre} />
          </li>
        ))}
      </ul>
    </section>
  );
}
