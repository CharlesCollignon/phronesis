import Link from "next/link";
import { notFound } from "next/navigation";

import { PhiloRadar } from "@/components/charts/philo-radar";
import { PageShell } from "@/components/breadcrumbs";
import { Hemicycle } from "@/components/hemicycle";
import { AxesBars, RadarProfil } from "@/components/profil-axes";
import { ResonancePanel } from "@/components/resonance-panel";
import { getEmpreinteGroupe } from "@/lib/empreinte-groupe";
import { listGroupesEffectifs } from "@/lib/queries";
import { couleurGroupe } from "@/lib/spectre-groupes";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uid: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<{ title: string }> {
  const { uid } = await params;
  const data = await getEmpreinteGroupe(uid);
  return {
    title: data
      ? `${data.groupe.libelle} — Groupe`
      : "Groupe parlementaire",
  };
}

export default async function GroupePage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const data = await getEmpreinteGroupe(uid);
  if (!data) notFound();

  const { groupe, profil, axesUtilises } = data;
  const chambre: "AN" | "SENAT" =
    groupe.codeType === "GROUPESENAT" ? "SENAT" : "AN";
  const compareType =
    chambre === "SENAT" ? "groupes_senat" : "groupes";
  const effectifs = await listGroupesEffectifs(chambre);
  const tint = couleurGroupe(
    groupe.libelleAbrege,
    groupe.couleur,
  );

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Groupes", href: "/groupes" },
        { label: groupe.libelle },
      ]}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex h-10 min-w-10 items-center justify-center px-2 text-sm font-semibold text-white"
          style={{ background: tint }}
        >
          {(groupe.libelleAbrege ?? "?").slice(0, 4)}
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
          {groupe.libelle}
        </h1>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href={`/comparateur?type=${compareType}&a=${groupe.uid}`}
          className="text-[var(--accent-ink)] hover:underline"
        >
          Comparer ce groupe →
        </Link>
        <Link
          href="/methodologie"
          className="text-[var(--muted)] hover:underline"
        >
          Méthode d&apos;agrégation
        </Link>
      </div>

      <section className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <Hemicycle
          groups={effectifs}
          chambre={chambre}
          selectedUid={groupe.uid}
          compact
        />
      </section>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
        Vecteur construit à partir des majorités pour/contre du
        groupe sur des scrutins publics liés à des dossiers avec
        empreinte. Ce n&apos;est pas un score moral, ni le Score
        Phronesis. Majorité ≠ unanimité ; votes à main levée
        exclus.
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className=" border border-[var(--border)] bg-[var(--surface)] p-4">
          <dt className="text-xs uppercase tracking-wider text-[var(--muted)]">
            Scrutins mobilisés
          </dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl">
            {data.scrutinsMobilises}
          </dd>
        </div>
        <div className=" border border-[var(--border)] bg-[var(--surface)] p-4">
          <dt className="text-xs uppercase tracking-wider text-[var(--muted)]">
            Dossiers mobilisés
          </dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl">
            {data.dossiersMobilises}
          </dd>
        </div>
        <div className=" border border-[var(--border)] bg-[var(--surface)] p-4">
          <dt className="text-xs uppercase tracking-wider text-[var(--muted)]">
            Axes renseignés
          </dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl">
            {axesUtilises.length}
          </dd>
        </div>
      </dl>

      {data.scrutinsMobilises === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          Pas assez de scrutins publics liés à des dossiers avec
          empreinte pour construire un vecteur.
        </p>
      ) : (
        <>
          <section className="mt-12 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                Empreinte agrégée
              </h2>
              <div className="mt-6">
                <RadarProfil
                  profil={profil}
                  ariaLabel={`Profil ${groupe.libelle}`}
                />
              </div>
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-xl">
                Axes
              </h3>
              <div className="mt-3">
                <AxesBars
                  profil={profil}
                  axes={
                    axesUtilises.length > 0
                      ? axesUtilises
                      : undefined
                  }
                />
              </div>
            </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                Proximité philosophique
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Similarité cosinus avec les six conceptions de
                référence — pas une affiliation partisane.
              </p>
              <div className="mt-4 border border-[var(--border)] bg-[var(--surface)] p-3">
                <PhiloRadar
                  items={data.rankingPhilosophies.map(
                    ({ philo, score }) => ({
                      label: philo.label,
                      score,
                    }),
                  )}
                />
              </div>
              <ul className="mt-4 space-y-3">
                {data.rankingPhilosophies.map(({ philo, score }) => (
                  <li
                    key={philo.id}
                    className=" border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/philosophies/${philo.id}`}
                        className="font-medium hover:text-[var(--accent-ink)] hover:underline"
                      >
                        {philo.label}
                      </Link>
                      <span className="text-sm text-[var(--muted)]">
                        {(score * 100).toFixed(0)} %
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <ResonancePanel
              rows={data.empreinteSynthetique}
              compareLabel="Projection groupe"
              title="Résonance avec votre boussole"
            />
          </section>
        </>
      )}
    </PageShell>
  );
}
