"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AxesBars, RadarProfil } from "@/components/profil-axes";
import {
  loadBoussoleStored,
  pushBoussoleToCloud,
  saveBoussoleStored,
  syncBoussoleAfterAuth,
} from "@/lib/boussole-storage";
import { DILEMMES, computeProfil } from "@/lib/dilemmes";
import { rankPhilosophies } from "@/lib/philosophies";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

function applyValidReponses(
  raw: Record<string, string>,
): Record<string, string> {
  const valid: Record<string, string> = {};
  for (const d of DILEMMES) {
    const choixId = raw[d.id];
    if (choixId && d.choix.some((c) => c.id === choixId)) {
      valid[d.id] = choixId;
    }
  }
  return valid;
}

export function BoussoleQuiz(): React.ReactElement {
  if (HAS_CLERK) {
    return <BoussoleQuizWithAuth />;
  }
  return <BoussoleQuizInner isSignedIn={false} persistLocal />;
}

function BoussoleQuizWithAuth(): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <p className="text-sm text-[var(--muted)]">Chargement…</p>
    );
  }
  return (
    <BoussoleQuizInner
      isSignedIn={Boolean(isSignedIn)}
      persistLocal={Boolean(isSignedIn)}
    />
  );
}

function BoussoleQuizInner({
  isSignedIn,
  persistLocal,
}: {
  isSignedIn: boolean;
  persistLocal: boolean;
}): React.ReactElement {
  const [reponses, setReponses] = useState<Record<string, string>>(
    {},
  );
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot(): Promise<void> {
      if (HAS_CLERK && !isSignedIn) {
        setReponses({});
        setShowResults(false);
        setStep(0);
        setSyncNote(null);
        setReady(true);
        return;
      }

      let raw = persistLocal ? loadBoussoleStored().reponses : {};
      if (HAS_CLERK && isSignedIn) {
        try {
          const synced = await syncBoussoleAfterAuth();
          if (!cancelled && Object.keys(synced).length > 0) {
            raw = synced;
            setSyncNote("Profil synchronisé avec votre compte.");
          }
        } catch {
          /* keep local */
        }
      }
      if (cancelled) return;
      const valid = applyValidReponses(raw);
      setReponses(valid);
      const answered = DILEMMES.filter((d) => valid[d.id]).length;
      const done = answered >= DILEMMES.length;
      setShowResults(done);
      setStep(
        done
          ? DILEMMES.length - 1
          : Math.min(answered, DILEMMES.length - 1),
      );
      setReady(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, persistLocal]);

  const answeredCount = DILEMMES.filter((d) => reponses[d.id]).length;
  const complete = answeredCount === DILEMMES.length;

  const profil = useMemo(
    () => (complete ? computeProfil(reponses) : null),
    [complete, reponses],
  );
  const ranking = useMemo(
    () => (profil ? rankPhilosophies(profil) : []),
    [profil],
  );

  function choose(dilemmeId: string, choixId: string): void {
    const next = { ...reponses, [dilemmeId]: choixId };
    setReponses(next);
    if (persistLocal) {
      saveBoussoleStored({ reponses: next });
      if (HAS_CLERK && isSignedIn) void pushBoussoleToCloud(next);
    }
    const done =
      DILEMMES.filter((d) => next[d.id]).length === DILEMMES.length;
    if (done && step >= DILEMMES.length - 1) {
      setShowResults(true);
    }
  }

  function reset(): void {
    setReponses({});
    if (persistLocal) {
      saveBoussoleStored({ reponses: {} });
      if (HAS_CLERK && isSignedIn) void pushBoussoleToCloud({});
    }
    setStep(0);
    setShowResults(false);
    setSyncNote(null);
  }

  if (!ready) {
    return (
      <p className="text-sm text-[var(--muted)]">Chargement…</p>
    );
  }

  if (showResults && complete && profil) {
    return (
      <div className="space-y-10">
        {syncNote ? (
          <p className="text-xs text-[var(--accent-ink)]">{syncNote}</p>
        ) : null}
        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              Votre boussole
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Carte de valeurs construite à partir de vos{" "}
              {DILEMMES.length} réponses — pas une étiquette
              partisane. Les barres vont de « peu marqué » (gauche)
              à « très marqué » (droite) pour chaque axe.
            </p>
            <div className="mt-6">
              <RadarProfil
                profil={profil}
                ariaLabel="Boussole des valeurs"
              />
            </div>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl">
              Lecture des axes
            </h3>
            <div className="mt-3">
              <AxesBars profil={profil} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Proximité avec des conceptions philosophiques
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Similarité de profil (cosinus). Ce n&apos;est pas « vous
            êtes de tel parti », mais une proximité avec une façon
            de concevoir la justice, la liberté ou l&apos;État.{" "}
            <Link
              href="/philosophies"
              className="text-[var(--accent)] hover:underline"
            >
              Voir toutes les fiches
            </Link>
            .
          </p>
          <ul className="mt-4 space-y-3">
            {ranking.map(({ philo, score }) => (
              <li
                key={philo.id}
                className=" border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    <Link
                      href={`/philosophies/${philo.id}`}
                      className="hover:text-[var(--accent)] hover:underline"
                    >
                      {philo.label}
                    </Link>
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {(score * 100).toFixed(0)} % de similarité
                  </p>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {philo.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className=" border border-[var(--ink)]/20 px-4 py-2 text-sm hover:bg-[var(--ink)]/5"
          >
            Recommencer
          </button>
          <button
            type="button"
            onClick={() => {
              setShowResults(false);
              setStep(0);
            }}
            className=" border border-[var(--ink)]/20 px-4 py-2 text-sm hover:bg-[var(--ink)]/5"
          >
            Revoir les questions
          </button>
          <Link
            href="/methodologie"
            className=" px-4 py-2 text-sm text-[var(--accent)] hover:underline"
          >
            Voir la méthode
          </Link>
        </div>
      </div>
    );
  }

  const dilemme = DILEMMES[step]!;
  const progress = Math.round(
    (100 * answeredCount) / DILEMMES.length,
  );

  return (
    <div className="mx-auto max-w-2xl">
      {HAS_CLERK && !isSignedIn ? (
        <p className="mb-4 border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--muted)]">
          <Link
            href="/sign-in"
            className="text-[var(--accent-ink)] hover:underline"
          >
            Connectez-vous
          </Link>{" "}
          pour sauvegarder et retrouver votre boussole.
        </p>
      ) : null}
      <div className="mb-4 h-1.5 overflow-hidden bg-[var(--wash)]">
        <div
          className="h-full bg-[var(--accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
        Question {step + 1} / {DILEMMES.length}
        {reponses[dilemme.id] ? " · répondue" : ""}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl leading-snug">
        {dilemme.question}
      </h2>

      <aside className="mt-4 space-y-3 border border-[var(--border)] bg-[var(--wash)] p-4 text-sm leading-relaxed">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Contexte
          </p>
          <p className="mt-1 text-[var(--ink)]/90">{dilemme.contexte}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Ce que l&apos;on cherche à éclairer
          </p>
          <p className="mt-1 text-[var(--ink)]/90">{dilemme.enjeu}</p>
        </div>
      </aside>

      <p className="mt-5 text-xs text-[var(--muted)]">
        Quatre réponses graduées — du plus marqué d&apos;un côté au
        plus marqué de l&apos;autre. Il n&apos;y a pas de bonne
        réponse.
      </p>

      <div className="mt-3 grid gap-3">
        {dilemme.choix.map((c, index) => (
          <button
            key={c.id}
            type="button"
            onClick={() => choose(dilemme.id, c.id)}
            className={
              reponses[dilemme.id] === c.id
                ? " border-2 border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-4 text-left"
                : " border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-left transition hover:border-[var(--accent)]/40"
            }
          >
            <p className="text-xs text-[var(--muted)]">
              Option {index + 1} / 4
            </p>
            <p className="mt-0.5 text-sm font-medium">{c.label}</p>
            <p className="mt-1 text-sm leading-snug text-[var(--muted)]">
              {c.nuance}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between text-sm">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep(Math.max(0, step - 1))}
          className="text-[var(--muted)] disabled:opacity-40"
        >
          ← Précédent
        </button>
        {step < DILEMMES.length - 1 ? (
          <button
            type="button"
            disabled={!reponses[dilemme.id]}
            onClick={() => setStep(step + 1)}
            className="text-[var(--accent)] disabled:opacity-40"
          >
            Suivant →
          </button>
        ) : (
          <button
            type="button"
            disabled={!complete}
            onClick={() => setShowResults(true)}
            className="font-medium text-[var(--accent)] disabled:opacity-40"
          >
            Voir mon résultat →
          </button>
        )}
      </div>
    </div>
  );
}
