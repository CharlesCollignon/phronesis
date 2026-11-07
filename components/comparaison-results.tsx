import Link from "next/link";

import { AccordGauge } from "@/components/charts/accord-gauge";
import { ComparateurScrutins } from "@/components/comparateur-scrutins";
import { Stat } from "@/components/stat";
import type {
  ComparaisonResume,
  ComparaisonScrutin,
} from "@/lib/comparateur";
import { formatNumber } from "@/lib/format";

type ComparaisonResultsProps = {
  labelA: string;
  labelB: string;
  hrefA?: string;
  hrefB?: string;
  /** Sujet de la phrase de synthèse (« les deux députés »…). */
  sujet?: string;
  /** Surtitre des deux blocs (« Élu », « Groupe »). */
  kind?: string;
  /** Ligne secondaire sous chaque nom (groupe, circonscription…). */
  metaA?: string;
  metaB?: string;
  resume: ComparaisonResume;
  convergences: ComparaisonScrutin[];
  divergences: ComparaisonScrutin[];
  showNonVotants?: boolean;
};

function Side({
  label,
  href,
  tag,
  meta,
}: {
  label: string;
  href?: string;
  tag: string;
  meta?: string;
}): React.ReactElement {
  const inner = (
    <>
      <span className="eyebrow">{tag}</span>
      <span className="text-[clamp(20px,2vw,24px)] font-medium leading-tight tracking-[-0.015em]">
        {label}
      </span>
      {meta ? (
        <span className="text-[15px] text-muted-foreground">{meta}</span>
      ) : null}
    </>
  );
  const cls =
    "flex min-w-0 flex-[1_1_320px] flex-col gap-1.5 border border-border p-5";
  return href ? (
    <Link
      href={href}
      className={`${cls} group transition-colors duration-200 hover:border-foreground`}
    >
      {inner}
      <span className="ln mt-1 self-start text-sm font-medium">
        Voir la fiche
      </span>
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function ComparaisonResults({
  labelA,
  labelB,
  hrefA,
  hrefB,
  sujet = "les deux",
  kind = "Élu",
  metaA,
  metaB,
  resume,
  convergences,
  divergences,
  showNonVotants = false,
}: ComparaisonResultsProps): React.ReactElement {
  const items = [...convergences, ...divergences].sort((x, y) => {
    const d = String(y.dateScrutin).localeCompare(String(x.dateScrutin));
    return d !== 0 ? d : y.numero - x.numero;
  });

  return (
    <div className="mt-12">
      <h2 className="sr-only">
        {labelA} et {labelB}
      </h2>
      <div className="flex flex-wrap items-stretch gap-4">
        <Side label={labelA} href={hrefA} tag={`${kind} A`} meta={metaA} />
        <span
          aria-hidden
          className="hidden items-center text-2xl text-muted-foreground sm:flex"
        >
          ×
        </span>
        <Side label={labelB} href={hrefB} tag={`${kind} B`} meta={metaB} />
      </div>

      <div className="mt-10">
        <AccordGauge
          taux={resume.tauxAccord}
          accords={resume.accords}
          compares={resume.compares}
          sujet={sujet}
        />
        <p className="mt-3.5 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
          Un taux d&apos;accord décrit des votes, pas des convictions.
          Accord mesuré sur les scrutins publics où les deux ont une
          position pour, contre ou abstention ; il dépend des scrutins
          où les deux étaient présents, majoritairement des
          amendements. Les non-votants sont exclus du taux
          d&apos;accord.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Stat
          label="Scrutins comparés"
          value={formatNumber(resume.compares)}
        />
        <Stat label="Accords" value={formatNumber(resume.accords)} />
        <Stat
          label="Divergences"
          value={formatNumber(resume.divergences)}
        />
        {showNonVotants ? (
          <>
            <Stat
              label={`Non-votant (${labelA})`}
              value={formatNumber(resume.nonVotantA)}
              hint="Sur les scrutins communs"
            />
            <Stat
              label={`Non-votant (${labelB})`}
              value={formatNumber(resume.nonVotantB)}
              hint="Sur les scrutins communs"
            />
            <Stat
              label={`Seulement ${labelA}`}
              value={formatNumber(resume.seulementA)}
            />
            <Stat
              label={`Seulement ${labelB}`}
              value={formatNumber(resume.seulementB)}
            />
          </>
        ) : null}
      </div>

      <section className="pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-foreground pb-4">
          <h2 className="text-[clamp(22px,2.2vw,28px)] font-semibold leading-tight tracking-[-0.015em]">
            Scrutins récents en commun
          </h2>
          <p className="text-sm text-muted-foreground">
            Échantillon : {convergences.length} accords et{" "}
            {divergences.length} désaccords les plus récents
          </p>
        </div>
        <ComparateurScrutins
          items={items}
          labelA={labelA}
          labelB={labelB}
          nbAccords={convergences.length}
          nbDesaccords={divergences.length}
        />
      </section>
    </div>
  );
}
