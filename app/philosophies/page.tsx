import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  PageHeader,
  PageShell,
  SectionHeading,
} from "@/components/breadcrumbs";
import { AXE_FONDEMENTS } from "@/lib/axes-boussole-fondements";
import {
  AXE_BOUSSOLE_LABELS,
  AXES_BOUSSOLE,
} from "@/lib/dilemmes";
import { PHILOSOPHIES } from "@/lib/philosophies";

export const metadata = {
  title: "Conceptions philosophiques",
};

export default function PhilosophiesPage(): React.ReactElement {
  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Philosophies" },
      ]}
    >
      <PageHeader
        title="Philosophies"
        description={
          <>
            Six façons de concevoir la justice, la liberté ou le rôle de
            l&apos;État : des profils de référence pour situer des valeurs,
            pas des étiquettes partisanes. Elles servent à la{" "}
            <Link href="/boussole" className="ln text-foreground">
              Boussole
            </Link>{" "}
            et, plus loin, à lire des résonances avec des lois ou des
            groupes.
          </>
        }
      />

      <section className="pt-14">
        <SectionHeading
          title="Les six conceptions"
          aside="Idéal-types simplifiés, pas des programmes"
        />
        <ul className="border-b border-border">
          {PHILOSOPHIES.map((philo, i) => (
            <li key={philo.id}>
              <Link
                href={`/philosophies/${philo.id}`}
                className="row-link group grid grid-cols-[32px_minmax(0,1fr)_20px] items-baseline gap-x-6 gap-y-1.5 border-t border-border px-2 py-6 md:grid-cols-[48px_minmax(0,280px)_minmax(0,1fr)_24px]"
              >
                <span className="num text-sm text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[clamp(22px,2.2vw,28px)] font-medium leading-tight tracking-[-0.015em] transition-transform duration-500 ease-[var(--spring)] group-hover:translate-x-1.5">
                  {philo.label}
                </span>
                <span className="col-start-2 row-start-2 text-[15px] leading-relaxed text-muted-foreground md:col-start-auto md:row-start-auto">
                  {philo.description}
                </span>
                <ArrowRight
                  aria-hidden
                  className="nudge col-start-3 row-start-1 size-5 self-center text-muted-foreground group-hover:text-foreground md:col-start-auto"
                  strokeWidth={1.6}
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="glossaire" className="scroll-mt-16 pt-20">
        <SectionHeading title="Glossaire des axes" />
        <p className="max-w-3xl pb-6 text-base leading-relaxed text-muted-foreground">
          Les mêmes dix axes structurent la Boussole et ces fiches. Ce ne
          sont pas des notes morales : ce sont des dimensions
          d&apos;arbitrage, avec un fondement conceptuel explicite.
        </p>
        <dl className="border-b border-border">
          {AXES_BOUSSOLE.map((axe) => {
            const f = AXE_FONDEMENTS[axe];
            return (
              <div
                key={axe}
                id={`axe-${axe}`}
                className="grid scroll-mt-24 gap-2 border-t border-border py-6 target:bg-[var(--highlight)] target:shadow-[inset_3px_0_0_0_var(--accent)] md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:px-2"
              >
                <dt className="text-lg font-semibold">
                  {AXE_BOUSSOLE_LABELS[axe]}
                </dt>
                <dd className="max-w-3xl">
                  <p className="text-base leading-relaxed">{f.sens}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-8">
                    <div>
                      <p className="eyebrow">Distinction</p>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                        {f.distinction}
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow">Ce que ce n&apos;est pas</p>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                        {f.ceQueCeNestPas}
                      </p>
                    </div>
                  </div>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <p className="mt-10 text-[15px] text-muted-foreground">
        Méthode détaillée :{" "}
        <Link href="/methodologie#boussole" className="ln text-foreground">
          méthodologie
        </Link>
        .
      </p>
    </PageShell>
  );
}
