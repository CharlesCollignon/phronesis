import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/badge";
import { BoussoleTeaser } from "@/components/boussole-teaser";
import { PAGE_WRAP, SectionHeading } from "@/components/breadcrumbs";
import {
  EmpreinteGrid,
  IMPACT_LEGEND,
} from "@/components/empreinte-grid";
import { HemicyclePositions } from "@/components/hemicycle-positions";
import { VoteBar } from "@/components/vote-bar";
import {
  capitalizeTitre,
  formatDate,
  formatDateShort,
  formatNumber,
  formatSort,
} from "@/lib/format";
import { getHomeStats } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ENGAGEMENTS: [string, string][] = [
  [
    "Sources officielles",
    "Chaque fiche renvoie vers le document d'origine sur les sites de l'Assemblée nationale et du Sénat.",
  ],
  [
    "Neutralité",
    "Aucun classement de partis, aucune note morale, aucune consigne de vote.",
  ],
  [
    "Transparence de l'IA",
    "Résumés et empreintes indiquent leur modèle et leur version, et restent affichés à côté du texte officiel.",
  ],
  [
    "Confidentialité",
    "Votre Boussole reste sur votre appareil. Elle n'est synchronisée que si vous créez un compte.",
  ],
  [
    "Limites",
    "Seuls les scrutins publics sont nominatifs. Les votes à main levée n'apparaissent pas.",
  ],
];

function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export default async function HomePage(): Promise<React.ReactElement> {
  const {
    counts,
    derniersScrutins,
    derniersImports,
    dernierGrandScrutin: grand,
    empreinteExemple,
  } = await getHomeStats();

  const dernierImport = toIsoDate(derniersImports[0]?.importedAt);

  const index = [
    {
      n: "01",
      href: "/dossiers",
      title: "Lois",
      desc: `${formatNumber(Number(counts.dossiers))} dossiers législatifs, résumés en clair à côté du texte officiel.`,
    },
    {
      n: "02",
      href: "/scrutins",
      title: "Votes",
      desc: `${formatNumber(Number(counts.scrutins))} scrutins publics nominatifs, position par position.`,
    },
    {
      n: "03",
      href: "/deputes",
      title: "Élus",
      desc: "Députés et sénateurs en exercice, avec leur historique de votes.",
    },
    {
      n: "04",
      href: "/methodologie#empreinte",
      title: "Empreinte civique",
      desc: "Ce qu'un texte renforce ou restreint, sur dix axes justifiés.",
    },
    {
      n: "05",
      href: "/boussole",
      title: "Boussole",
      desc: "Des dilemmes concrets pour situer vos propres valeurs.",
    },
  ];

  return (
    <>
      <section className="bg-[#0a0a0a] text-white">
        <div
          className={cn(
            PAGE_WRAP,
            "flex flex-wrap items-end justify-between gap-12 pb-[clamp(56px,7vw,88px)] pt-[clamp(56px,8vw,104px)]",
          )}
        >
          <div className="min-w-0 flex-[1_1_560px]">
            <p className="eyebrow rise text-[#a3a3a3]">
              Observatoire civique du Parlement · 17<sup>e</sup>{" "}
              législature
            </p>
            <h1
              className="rise mt-5 max-w-3xl text-[clamp(38px,4.6vw,60px)] font-medium leading-[1.06] tracking-[-0.025em]"
              style={{ animationDelay: "80ms" }}
            >
              Comprendre la loi avant de la juger.
            </h1>
            <p
              className="rise mt-6 max-w-xl text-lg leading-relaxed text-[#c4c4c4]"
              style={{ animationDelay: "140ms" }}
            >
              Les lois, les votes et les élus de l&apos;Assemblée nationale
              et du Sénat, reliés à leurs sources officielles et lus avec une
              méthode publique. Sans consigne de vote.
            </p>
            <div
              className="rise mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "200ms" }}
            >
              <Link href="/dossiers" className="btn btn-accent h-12 px-6">
                Explorer les lois
              </Link>
              <Link
                href="/boussole"
                className="btn h-12 border-[#4a4a4a] px-6 text-white hover:border-white"
              >
                Faire ma Boussole
              </Link>
            </div>
          </div>
          <dl
            className="rise grid flex-[0_1_340px] grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm"
            style={{ animationDelay: "260ms" }}
          >
            <dt className="text-[#8a8a8a]">Sources</dt>
            <dd className="text-[#e5e5e5]">Assemblée nationale, Sénat</dd>
            <dt className="text-[#8a8a8a]">Licence</dt>
            <dd className="text-[#e5e5e5]">Licence Ouverte (Etalab)</dd>
            <dt className="text-[#8a8a8a]">Mise à jour</dt>
            <dd className="text-[#e5e5e5]">Hebdomadaire</dd>
            {dernierImport ? (
              <>
                <dt className="text-[#8a8a8a]">Dernier import</dt>
                <dd className="num text-[#e5e5e5]">
                  <time dateTime={dernierImport}>
                    {formatDate(dernierImport)}
                  </time>
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      </section>

      <section aria-label="Chiffres clés" className="border-b border-border">
        <div
          className={cn(
            PAGE_WRAP,
            "grid grid-cols-2 md:grid-cols-4",
          )}
        >
          {[
            [counts.dossiers, "dossiers législatifs"],
            [counts.scrutins, "scrutins publics"],
            [counts.votes, "positions nominatives"],
            [counts.deputes, "députés de la législature"],
          ].map(([value, label]) => (
            <div key={String(label)} className="py-6 pr-6 md:py-7">
              <p className="num text-[32px] font-medium tracking-[-0.02em]">
                {formatNumber(Number(value))}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className={cn(PAGE_WRAP, "pb-28")}>
        <section className="pt-[clamp(72px,8vw,112px)]">
          <SectionHeading
            title="Explorer"
            aside="Cinq entrées dans les données du Parlement"
          />
          <div className="border-b border-border">
            {index.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="row-link group grid grid-cols-[36px_minmax(0,1fr)_20px] items-center gap-x-6 gap-y-1 border-t border-border py-[22px] md:grid-cols-[56px_minmax(0,1fr)_minmax(0,360px)_24px]"
              >
                <span className="num text-sm text-muted-foreground">
                  {item.n}
                </span>
                <span className="text-[clamp(24px,2.6vw,34px)] font-medium tracking-[-0.015em] transition-transform duration-500 ease-[var(--spring)] group-hover:translate-x-2">
                  {item.title}
                </span>
                <span className="col-start-2 row-start-2 text-[15px] leading-snug text-muted-foreground md:col-start-auto md:row-start-auto">
                  {item.desc}
                </span>
                <ArrowRight
                  aria-hidden
                  className="nudge col-start-3 row-start-1 size-5 text-muted-foreground group-hover:text-foreground md:col-start-4"
                  strokeWidth={1.6}
                />
              </Link>
            ))}
          </div>
        </section>

        <section className="pt-[clamp(80px,9vw,128px)]">
          <p className="max-w-4xl text-[clamp(24px,2.5vw,34px)] leading-[1.4] tracking-[-0.015em]">
            Phronesis <span className="mk">ne vous dit pas quoi penser.</span>{" "}
            Il relie chaque texte à sa source, décrit ce qu&apos;il renforce
            ou restreint, et <span className="mk">vous laisse juger.</span>{" "}
            Ni gauche ni droite, ni note morale, ni consigne de vote.
          </p>
        </section>

        {grand ? (
          <section className="pt-[clamp(80px,9vw,128px)]">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="max-w-3xl">
                <p className="eyebrow">
                  Scrutin public n° {formatNumber(grand.numero)} ·{" "}
                  {formatDate(grand.dateScrutin)}
                </p>
                <h2 className="mt-2.5 text-[clamp(22px,2.2vw,28px)] font-semibold leading-snug tracking-[-0.015em]">
                  <Link href={`/scrutins/${grand.uid}`} className="hover:underline">
                    {capitalizeTitre(grand.titre)}
                  </Link>
                </h2>
              </div>
              <Badge
                tone={
                  grand.sortCode.toLowerCase().includes("adopt")
                    ? "adopte"
                    : "rejete"
                }
                className="text-[15px]"
              >
                {formatSort(grand.sortCode)}
              </Badge>
            </div>
            <HemicyclePositions
              className="mt-9"
              pour={grand.pour ?? 0}
              contre={grand.contre ?? 0}
              abstentions={grand.abstentions ?? 0}
              sieges={577}
            />
          </section>
        ) : null}

        <section className="pt-[clamp(80px,9vw,128px)]">
          <SectionHeading
            title="Derniers scrutins publics"
            aside={
              <Link href="/scrutins" className="ln text-foreground">
                Voir les {formatNumber(Number(counts.scrutins))} scrutins
              </Link>
            }
          />
          <div className="hidden grid-cols-[84px_104px_minmax(0,1fr)_92px_120px] gap-5 px-2 pb-2.5 text-[13px] text-muted-foreground md:grid">
            <span>Numéro</span>
            <span>Date</span>
            <span>Objet</span>
            <span>Résultat</span>
            <span className="text-right">Pour · contre</span>
          </div>
          <ul className="border-b border-border">
            {derniersScrutins.slice(0, 6).map((s) => {
              const adopte = s.sortCode.toLowerCase().includes("adopt");
              return (
                <li key={s.uid}>
                  <Link
                    href={`/scrutins/${s.uid}`}
                    className="row-link grid grid-cols-[minmax(0,1fr)_88px] items-baseline gap-5 border-t border-border px-2 py-4 md:grid-cols-[84px_104px_minmax(0,1fr)_92px_120px]"
                  >
                    <span className="num hidden text-sm text-muted-foreground md:block">
                      {formatNumber(s.numero)}
                    </span>
                    <span className="num hidden text-sm text-muted-foreground md:block">
                      {formatDateShort(s.dateScrutin)}
                    </span>
                    <span className="text-base leading-snug">
                      {capitalizeTitre(s.titre)}
                    </span>
                    <Badge tone={adopte ? "adopte" : "rejete"}>
                      {formatSort(s.sortCode)}
                    </Badge>
                    <span className="hidden flex-col items-end gap-1.5 md:flex">
                      <VoteBar
                        pour={s.pour ?? 0}
                        contre={s.contre ?? 0}
                        abstentions={s.abstentions ?? 0}
                      />
                      <span className="num text-[13px] text-muted-foreground">
                        {s.pour ?? 0} · {s.contre ?? 0}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {empreinteExemple ? (
          <section className="pt-[clamp(80px,9vw,128px)]">
            <div className="flex flex-wrap items-baseline justify-between gap-3 pb-6">
              <div className="max-w-3xl">
                <p className="eyebrow">Empreinte civique · exemple</p>
                <h2 className="mt-2.5 text-[clamp(22px,2.2vw,28px)] font-semibold leading-snug tracking-[-0.015em]">
                  <Link
                    href={`/dossiers/${empreinteExemple.uid}`}
                    className="hover:underline"
                  >
                    {empreinteExemple.titre}
                  </Link>
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">{IMPACT_LEGEND}</p>
            </div>
            <EmpreinteGrid rows={empreinteExemple.rows} cellMin={176} />
            <p className="mt-4 text-[13px] text-muted-foreground">
              Analyse qualitative générée par IA. Aucune note par axe,
              aucun conseil de vote.
            </p>
          </section>
        ) : null}

        <section className="pt-[clamp(80px,9vw,128px)]">
          <BoussoleTeaser />
        </section>

        <section className="pt-[clamp(80px,9vw,128px)]">
          <SectionHeading title="Nos engagements" />
          <dl className="border-b border-border">
            {ENGAGEMENTS.map(([title, text]) => (
              <div
                key={title}
                className="grid gap-1.5 border-t border-border py-5 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6"
              >
                <dt className="font-semibold">{title}</dt>
                <dd className="text-base leading-relaxed text-muted-foreground">
                  {text}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
