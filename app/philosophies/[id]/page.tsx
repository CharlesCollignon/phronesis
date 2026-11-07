import Link from "next/link";
import { notFound } from "next/navigation";

import { AxesBars } from "@/components/profil-axes";
import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { AXE_BOUSSOLE_LABELS } from "@/lib/dilemmes";
import {
  PHILOSOPHIES,
  axesMarques,
  getPhilosophie,
  profilPhilosophieNormalise,
} from "@/lib/philosophies";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams(): { id: string }[] {
  return PHILOSOPHIES.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<{ title: string }> {
  const { id } = await params;
  const philo = getPhilosophie(id);
  return {
    title: philo
      ? `${philo.label} — Conceptions`
      : "Conception philosophique",
  };
}

export default async function PhilosophiePage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const philo = getPhilosophie(id);
  if (!philo) notFound();

  const profil = profilPhilosophieNormalise(philo.profil);
  const { forts, faibles } = axesMarques(philo.profil);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Philosophies", href: "/philosophies" },
        { label: philo.label },
      ]}
    >
      <PageHeader
        eyebrow="Conception de référence"
        title={philo.label}
        description={philo.description}
      />

      <div className="mt-12 flex flex-wrap items-start gap-x-14 gap-y-16">
        <article className="min-w-0 flex-[2_1_600px]">
          <p className="max-w-3xl text-[17px] leading-[1.7]">
            {philo.presentation}
          </p>

          <h2 className="mt-10 text-[17px] font-semibold">Points clés</h2>
          <ul className="mt-2.5 max-w-3xl border-b border-border">
            {philo.pointsCles.map((p) => (
              <li
                key={p}
                className="border-t border-border py-3 text-base leading-relaxed"
              >
                {p}
              </li>
            ))}
          </ul>

          <h2 className="mt-12 text-[clamp(22px,2.2vw,28px)] font-semibold leading-tight tracking-[-0.015em]">
            Profil sur les axes de la Boussole
          </h2>
          <p className="mt-2 max-w-3xl pb-5 text-[15px] leading-relaxed text-muted-foreground">
            Profil type normalisé (−1 … +1, affiché de −100 à +100) sur les
            axes de la Boussole. Idéal-type simplifié, pas un programme
            électoral.
          </p>
          <AxesBars profil={profil} />

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="eyebrow">Axes les plus marqués</p>
              <ul className="mt-2.5 border-b border-border">
                {forts.map((axe) => (
                  <li
                    key={axe}
                    className="border-t border-border py-2.5 text-base"
                  >
                    {AXE_BOUSSOLE_LABELS[axe]}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">Axes les moins marqués</p>
              <ul className="mt-2.5 border-b border-border">
                {faibles.map((axe) => (
                  <li
                    key={axe}
                    className="border-t border-border py-2.5 text-base"
                  >
                    {AXE_BOUSSOLE_LABELS[axe]}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/boussole" className="btn btn-accent">
              Me comparer à ce profil
            </Link>
            <span className="text-sm text-muted-foreground">
              Faites la Boussole pour situer vos propres valeurs.
            </span>
          </div>
        </article>

        <aside className="min-w-0 flex-[1_1_300px]">
          <p className="eyebrow pb-3">Les six conceptions</p>
          <ul className="border-b border-border">
            {PHILOSOPHIES.map((p) => {
              const on = p.id === philo.id;
              return (
                <li key={p.id}>
                  <Link
                    href={`/philosophies/${p.id}`}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "row-link block border-t border-border px-4 py-4",
                      on &&
                        "bg-[var(--highlight)] shadow-[inset_3px_0_0_0_var(--accent)] dark:text-foreground",
                    )}
                  >
                    <span className="block text-[17px] font-medium">
                      {p.label}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                      {p.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/philosophies#glossaire" className="ln text-foreground">
              Glossaire des axes
            </Link>
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
