"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AxesBars, RadarProfil } from "@/components/profil-axes";
import { Button } from "@/components/ui/button";
import {
  loadBoussoleStored,
  pushBoussoleToCloud,
  saveBoussoleStored,
  syncBoussoleAfterAuth,
  touchBoussoleStreak,
  type EngagementStored,
} from "@/lib/boussole-storage";
import { AXE_FONDEMENTS } from "@/lib/axes-boussole-fondements";
import {
  AXE_BOUSSOLE_LABELS,
  DILEMMES,
  axesPrincipauxDuDilemme,
  computeProfil,
} from "@/lib/dilemmes";
import { rankPhilosophies } from "@/lib/philosophies";
import { cn } from "@/lib/utils";

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
      <p className="text-sm text-muted-foreground">Chargement…</p>
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
  const [engagement, setEngagement] = useState<EngagementStored>({
    lastVisit: "",
    streakDays: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function boot(): Promise<void> {
      if (HAS_CLERK && !isSignedIn) {
        setReponses({});
        setShowResults(false);
        setStep(0);
        setSyncNote(null);
        setEngagement(touchBoussoleStreak());
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
      const streak = touchBoussoleStreak();
      setEngagement(streak);
      if (HAS_CLERK && isSignedIn) {
        void pushBoussoleToCloud(valid);
      }
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
    setEngagement(touchBoussoleStreak());
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
      <p className="text-sm text-muted-foreground">Chargement…</p>
    );
  }

  if (showResults && complete && profil) {
    return (
      <div className="space-y-10">
        {syncNote ? (
          <p className="text-xs text-primary">{syncNote}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Boussole complète ({DILEMMES.length}/{DILEMMES.length}).
          {engagement.streakDays > 0 ? (
            <>
              {" "}
              Série : {engagement.streakDays} jour
              {engagement.streakDays > 1 ? "s" : ""} d&apos;affilée.
            </>
          ) : null}{" "}
          Explorez un{" "}
          <Link
            href="/dossiers"
            className="text-primary hover:underline"
          >
            dossier
          </Link>{" "}
          pour voir la résonance avec votre profil.
        </p>
        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl">
              Votre boussole
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
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
            <h3 className="font-serif text-xl">
              Lecture des axes
            </h3>
            <div className="mt-3">
              <AxesBars profil={profil} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl">
            Proximité avec des conceptions philosophiques
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
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
                className=" border border-border bg-card p-4"
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
                  <p className="text-sm text-muted-foreground">
                    {(score * 100).toFixed(0)} % de similarité
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {philo.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={reset}
          >
            Recommencer
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={() => {
              setShowResults(false);
              setStep(0);
            }}
          >
            Revoir les questions
          </Button>
          <Button asChild variant="link" className="rounded-none">
            <Link href="/methodologie">Voir la méthode</Link>
          </Button>
        </div>
      </div>
    );
  }

  const dilemme = DILEMMES[step]!;
  const axesPrincipaux = axesPrincipauxDuDilemme(dilemme);
  const progress = Math.round(
    (100 * answeredCount) / DILEMMES.length,
  );

  return (
    <div className="mx-auto max-w-2xl">
      {HAS_CLERK && !isSignedIn ? (
        <p className="mb-4 border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="text-primary hover:underline"
          >
            Connectez-vous
          </Link>{" "}
          pour sauvegarder et retrouver votre boussole.
        </p>
      ) : null}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Progression : {answeredCount}/{DILEMMES.length} dilemmes
        </span>
        {engagement.streakDays > 0 ? (
          <span>Série {engagement.streakDays} j.</span>
        ) : null}
      </div>
      <div className="mb-4 h-1.5 overflow-hidden bg-muted">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Question {step + 1} / {DILEMMES.length}
        {reponses[dilemme.id] ? " · répondue" : ""}
      </p>
      <h2 className="mt-2 font-serif text-2xl leading-snug">
        {dilemme.question}
      </h2>

      <aside className="mt-4 space-y-3 border border-border bg-muted p-4 text-sm leading-relaxed">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contexte
          </p>
          <p className="mt-1 text-foreground/90">{dilemme.contexte}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ce que l&apos;on cherche à éclairer
          </p>
          <p className="mt-1 text-foreground/90">{dilemme.enjeu}</p>
        </div>
        {axesPrincipaux.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Axes en jeu
            </p>
            <ul className="mt-2 space-y-2">
              {axesPrincipaux.map((axe) => {
                const f = AXE_FONDEMENTS[axe];
                return (
                  <li key={axe}>
                    <p className="text-sm font-medium text-foreground">
                      {AXE_BOUSSOLE_LABELS[axe]}
                    </p>
                    <p className="text-sm text-foreground/90">
                      {f.contexteCourt}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {f.distinction}
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Fondements détaillés :{" "}
              <Link
                href={`/philosophies#axe-${axesPrincipaux[0]}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                glossaire des axes
              </Link>
              .
            </p>
          </div>
        ) : null}
      </aside>

      <p className="mt-5 text-xs text-muted-foreground">
        Quatre réponses — des logiques distinctes, pas un
        simple curseur. Il n&apos;y a pas de bonne réponse.
      </p>

      <div className="mt-3 grid gap-3">
        {dilemme.choix.map((c, index) => (
          <Button
            key={c.id}
            type="button"
            variant="outline"
            onClick={() => choose(dilemme.id, c.id)}
            className={cn(
              "h-auto flex-col items-start gap-1 rounded-none px-5 py-4",
              "whitespace-normal shadow-none",
              reponses[dilemme.id] === c.id &&
                "border-2 border-accent bg-accent",
            )}
          >
            <span className="text-xs text-muted-foreground">
              Option {index + 1} / 4
            </span>
            <span className="text-sm font-medium text-foreground">
              {c.label}
            </span>
            <span className="text-sm leading-snug font-normal text-muted-foreground">
              {c.nuance}
            </span>
          </Button>
        ))}
      </div>

      <div className="mt-6 flex justify-between text-sm">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep(Math.max(0, step - 1))}
          className="rounded-none"
        >
          ← Précédent
        </Button>
        {step < DILEMMES.length - 1 ? (
          <Button
            type="button"
            variant="ghost"
            disabled={!reponses[dilemme.id]}
            onClick={() => setStep(step + 1)}
            className="rounded-none text-primary"
          >
            Suivant →
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={!complete}
            onClick={() => setShowResults(true)}
            className="rounded-none font-medium text-primary"
          >
            Voir mon résultat →
          </Button>
        )}
      </div>
    </div>
  );
}
