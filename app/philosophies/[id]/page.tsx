import Link from "next/link";
import { notFound } from "next/navigation";

import { AxesBars, RadarProfil } from "@/components/profil-axes";
import { PageShell } from "@/components/breadcrumbs";
import { AXE_BOUSSOLE_LABELS } from "@/lib/dilemmes";
import {
  PHILOSOPHIES,
  axesMarques,
  getPhilosophie,
  profilPhilosophieNormalise,
} from "@/lib/philosophies";

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
  const autres = PHILOSOPHIES.filter((p) => p.id !== philo.id);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Philosophies", href: "/philosophies" },
        { label: philo.label },
      ]}
    >
      <h1 className="font-serif text-4xl tracking-tight">
        {philo.label}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {philo.description}
      </p>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed">
        {philo.presentation}
      </p>

      <ul className="mt-6 max-w-xl list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {philo.pointsCles.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl">
            Profil de référence
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Profil type normalisé (−1 … +1) sur les axes de la
            Boussole. Idéal-type simplifié, pas un programme
            électoral.
          </p>
          <div className="mt-6">
            <RadarProfil
              profil={profil}
              ariaLabel={`Profil ${philo.label}`}
            />
          </div>
        </div>
        <div>
          <h3 className="font-serif text-xl">
            Lecture des axes
          </h3>
          <div className="mt-3">
            <AxesBars profil={profil} />
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className=" border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Axes les plus marqués
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {forts.map((axe) => (
              <li key={axe}>{AXE_BOUSSOLE_LABELS[axe]}</li>
            ))}
          </ul>
        </div>
        <div className=" border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Axes les moins marqués
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {faibles.map((axe) => (
              <li key={axe}>{AXE_BOUSSOLE_LABELS[axe]}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">
          Autres conceptions
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {autres.map((p) => (
            <li key={p.id}>
              <Link
                href={`/philosophies/${p.id}`}
                className="inline-block border border-border px-3 py-1.5 text-sm hover:border-[var(--accent)]/40"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Comparer à votre profil :{" "}
          <Link
            href="/boussole"
            className="text-[var(--accent)] hover:underline"
          >
            faire la Boussole
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}
