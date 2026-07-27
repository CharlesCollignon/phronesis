import Link from "next/link";

import { PageShell } from "@/components/breadcrumbs";
import {
  AXE_BOUSSOLE_HINTS,
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
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Conceptions philosophiques
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Six façons de concevoir la justice, la liberté ou le rôle de
        l&apos;État — des profils de référence pour situer des
        valeurs, pas des étiquettes partisanes. Elles servent à la{" "}
        <Link
          href="/boussole"
          className="text-[var(--accent)] hover:underline"
        >
          Boussole
        </Link>{" "}
        et, plus loin, à lire des résonances avec des lois ou des
        groupes.
      </p>

      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Les six conceptions
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PHILOSOPHIES.map((philo) => (
            <li key={philo.id}>
              <Link
                href={`/philosophies/${philo.id}`}
                className="block h-full border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]/40"
              >
                <p className="font-medium">{philo.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {philo.description}
                </p>
                <p className="mt-3 text-xs text-[var(--accent)]">
                  Lire la fiche →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Glossaire des axes
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Les mêmes dix axes structurent la Boussole et ces fiches.
          Ce ne sont pas des notes morales : ce sont des dimensions
          d&apos;arbitrage.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {AXES_BOUSSOLE.map((axe) => (
            <li
              key={axe}
              className=" border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <p className="font-medium">{AXE_BOUSSOLE_LABELS[axe]}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {AXE_BOUSSOLE_HINTS[axe]}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-[var(--muted)]">
        Méthode détaillée :{" "}
        <Link
          href="/methodologie"
          className="text-[var(--accent)] hover:underline"
        >
          méthodologie
        </Link>
        .
      </p>
    </PageShell>
  );
}
