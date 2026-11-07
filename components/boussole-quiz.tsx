"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AxesBars } from "@/components/profil-axes";
import {
  loadBoussoleStored,
  pushBoussoleToCloud,
  retirerConsentementBoussole,
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
  computeProfilDetaille,
  profilDepuisDetail,
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
  /** Date ISO de l'accord pour enregistrer la Boussole sur le compte. */
  const [consentement, setConsentement] = useState<string | null>(null);
  const compte = HAS_CLERK && isSignedIn;
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
          const etat = await syncBoussoleAfterAuth();
          if (!cancelled) {
            setConsentement(etat.consentement);
            if (etat.consentement && Object.keys(etat.reponses).length > 0) {
              raw = etat.reponses;
              setSyncNote("Profil synchronisé avec votre compte.");
            }
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
      setReady(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, persistLocal]);

  const answeredCount = DILEMMES.filter((d) => reponses[d.id]).length;
  const complete = answeredCount === DILEMMES.length;

  const detail = useMemo(
    () => (complete ? computeProfilDetaille(reponses) : null),
    [complete, reponses],
  );
  const profil = useMemo(
    () => (detail ? profilDepuisDetail(detail) : null),
    [detail],
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
      if (compte && consentement) void pushBoussoleToCloud(next);
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
      if (compte && consentement) void pushBoussoleToCloud({});
    }
    setStep(0);
    setShowResults(false);
    setSyncNote(null);
  }

  async function accepterEnregistrement(): Promise<void> {
    const c = await pushBoussoleToCloud(reponses, { consentement: true });
    setConsentement(c);
    setSyncNote(
      c
        ? "Boussole enregistrée sur votre compte."
        : "L'enregistrement sur votre compte a échoué. Réessayez plus tard.",
    );
  }

  async function retirerEnregistrement(): Promise<void> {
    const ok = await retirerConsentementBoussole();
    if (ok) setConsentement(null);
    setSyncNote(
      ok
        ? "Vos réponses ont été effacées de votre compte. Elles restent sur cet appareil."
        : "L'effacement a échoué. Réessayez plus tard.",
    );
  }

  const blocConsentement = compte ? (
    <ConsentementCompte
      consentement={consentement}
      onAccepter={() => void accepterEnregistrement()}
      onRetirer={() => void retirerEnregistrement()}
    />
  ) : null;

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground">Chargement…</p>
    );
  }

  if (showResults && complete && profil) {
    return (
      <section className="reveal" aria-labelledby="boussole-carte">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2
            id="boussole-carte"
            className="text-[clamp(22px,2.2vw,28px)] font-semibold leading-tight tracking-[-0.015em]"
          >
            Votre carte, après {DILEMMES.length} dilemmes
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-outline h-10"
              onClick={() => {
                setShowResults(false);
                setStep(0);
              }}
            >
              Revoir les questions
            </button>
            <button
              type="button"
              className="btn btn-outline h-10"
              onClick={reset}
            >
              Recommencer
            </button>
          </div>
        </div>
        {syncNote ? (
          <p className="mt-3 text-sm font-medium" role="status">
            {syncNote}
          </p>
        ) : null}
        {blocConsentement}
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[#404040] dark:text-muted-foreground">
          Boussole complète ({DILEMMES.length}/{DILEMMES.length}).
          {engagement.streakDays > 0 ? (
            <>
              {" "}
              Série : {engagement.streakDays} jour
              {engagement.streakDays > 1 ? "s" : ""} d&apos;affilée.
            </>
          ) : null}{" "}
          Carte de valeurs construite à partir de vos {DILEMMES.length}{" "}
          réponses, pas une étiquette partisane. Explorez un{" "}
          <Link href="/dossiers" className="ln text-foreground">
            dossier
          </Link>{" "}
          pour voir la résonance avec votre profil.
        </p>

        <div className="mt-10 flex flex-wrap gap-14">
          <div className="min-w-0 flex-[1.3_1_480px]">
            <p className="eyebrow pb-3">Lecture des axes</p>
            <AxesBars profil={profil} detail={detail ?? undefined} />
          </div>

          <div className="min-w-0 flex-[1_1_340px]">
            <p className="eyebrow">Conceptions les plus proches</p>
            <ol className="mt-3 border-b border-border">
              {ranking.map(({ philo, score }, i) => {
                const top = i === 0;
                const w = Math.max(0, score) * 100;
                return (
                  <li key={philo.id}>
                    <Link
                      href={`/philosophies/${philo.id}`}
                      aria-current={top ? "true" : undefined}
                      className={cn(
                        "row-link grid grid-cols-[24px_minmax(0,1fr)_52px] items-baseline gap-x-4 gap-y-1 border-t border-border px-2 py-3.5 sm:grid-cols-[28px_minmax(0,1fr)_120px_52px]",
                        top &&
                          "bg-[var(--highlight)] shadow-[inset_3px_0_0_0_var(--accent)] dark:text-foreground",
                      )}
                    >
                      <span className="num text-sm text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-medium">
                          {philo.label}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                          {philo.description}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="hidden h-1.5 self-center bg-current/10 sm:block"
                      >
                        <span
                          className="grow-x block h-full bg-current"
                          style={{
                            width: `${w}%`,
                            animationDelay: `${200 + i * 60}ms`,
                          }}
                        />
                      </span>
                      <span className="num text-right text-sm font-semibold">
                        {(score * 100).toFixed(0)} %
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Similarité de profil (cosinus). Ce n&apos;est pas « vous
              êtes de tel parti », mais une proximité avec une façon de
              concevoir la justice, la liberté ou l&apos;État.{" "}
              <Link href="/philosophies" className="ln text-foreground">
                Voir toutes les fiches
              </Link>
              {" · "}
              <Link href="/methodologie#boussole" className="ln text-foreground">
                Voir la méthode
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  const dilemme = DILEMMES[step]!;
  const axesPrincipaux = axesPrincipauxDuDilemme(dilemme);
  const progress = Math.round(
    (100 * answeredCount) / DILEMMES.length,
  );
  const current = reponses[dilemme.id];
  const isLast = step >= DILEMMES.length - 1;

  return (
    <div>
      {HAS_CLERK && !isSignedIn ? (
        <p className="mb-6 text-[15px] text-muted-foreground">
          <Link href="/sign-in" className="ln font-medium text-foreground">
            Connectez-vous
          </Link>{" "}
          pour sauvegarder et retrouver votre boussole.
        </p>
      ) : null}
      {blocConsentement ? <div className="mb-6">{blocConsentement}</div> : null}

      <div className="flex items-center gap-4">
        <div
          role="progressbar"
          aria-label="Progression"
          aria-valuemin={0}
          aria-valuemax={DILEMMES.length}
          aria-valuenow={answeredCount}
          className="h-1 flex-1 bg-current/10"
        >
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-700 ease-[var(--spring)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="num text-sm font-semibold">
          {answeredCount} / {DILEMMES.length}
        </span>
        {engagement.streakDays > 0 ? (
          <span className="text-sm text-muted-foreground">
            Série {engagement.streakDays} j.
          </span>
        ) : null}
      </div>

      <section
        key={dilemme.id}
        className="reveal mt-10 flex flex-wrap gap-12"
        aria-labelledby={`dilemme-${dilemme.id}`}
      >
        <div className="min-w-0 flex-[1_1_300px]">
          <p className="eyebrow">
            Dilemme {step + 1} sur {DILEMMES.length}
            {current ? " · répondu" : ""}
          </p>
          <h2
            id={`dilemme-${dilemme.id}`}
            className="mt-3 text-[clamp(24px,2.6vw,34px)] font-medium leading-[1.2] tracking-[-0.02em]"
          >
            {dilemme.question}
          </h2>

          <dl className="mt-8 border-b border-border text-[15px] leading-relaxed">
            <div className="border-t border-border py-4">
              <dt className="eyebrow">Contexte</dt>
              <dd className="mt-1.5">{dilemme.contexte}</dd>
            </div>
            <div className="border-t border-border py-4">
              <dt className="eyebrow">Ce que l&apos;on cherche à éclairer</dt>
              <dd className="mt-1.5">{dilemme.enjeu}</dd>
            </div>
            {axesPrincipaux.length > 0 ? (
              <div className="border-t border-border py-4">
                <dt className="eyebrow">Axes en jeu</dt>
                <dd>
                  <ul className="mt-1.5 space-y-3">
                    {axesPrincipaux.map((axe) => {
                      const f = AXE_FONDEMENTS[axe];
                      return (
                        <li key={axe}>
                          <p className="font-medium">
                            {AXE_BOUSSOLE_LABELS[axe]}
                          </p>
                          <p>{f.contexteCourt}</p>
                          <p className="mt-0.5 text-[13px] text-muted-foreground">
                            {f.distinction}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-[13px] text-muted-foreground">
                    Fondements détaillés :{" "}
                    <Link
                      href={`/philosophies#axe-${axesPrincipaux[0]}`}
                      className="ln text-foreground"
                    >
                      glossaire des axes
                    </Link>
                    .
                  </p>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="min-w-0 flex-[1.4_1_460px]">
          <p className="pb-3 text-sm text-muted-foreground">
            Quatre réponses, des logiques distinctes, pas un simple
            curseur. Il n&apos;y a pas de bonne réponse.
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`dilemme-${dilemme.id}`}
            className="border-b border-border"
          >
            {dilemme.choix.map((c, i) => {
              const on = current === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => choose(dilemme.id, c.id)}
                  className={cn(
                    "grid w-full grid-cols-[40px_minmax(0,1fr)] items-baseline gap-3 border-t border-border py-5 pr-3 text-left",
                    "transition-[background-color,box-shadow,color] duration-500 ease-[var(--spring)]",
                    on
                      ? "bg-[var(--highlight)] shadow-[inset_3px_0_0_0_var(--accent)] dark:text-foreground"
                      : "hover:bg-[var(--hover)]",
                    current && !on && "text-muted-foreground",
                  )}
                >
                  <span className="pl-3.5 text-sm font-semibold text-muted-foreground">
                    {"ABCD".charAt(i)}
                  </span>
                  <span>
                    <span className="block text-lg leading-snug">
                      {c.label}
                    </span>
                    <span className="mt-1 block text-[15px] leading-snug text-muted-foreground">
                      {c.nuance}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              className="btn btn-outline"
              disabled={step === 0}
              onClick={() => setStep(Math.max(0, step - 1))}
            >
              Précédent
            </button>
            {!isLast ? (
              <button
                type="button"
                className="btn btn-accent"
                disabled={!current}
                onClick={() => setStep(step + 1)}
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-accent"
                disabled={!complete}
                onClick={() => setShowResults(true)}
              >
                Voir ma carte
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Accord explicite avant d'enregistrer la Boussole sur le compte : les
 * réponses révèlent des opinions politiques (RGPD, art. 9).
 */
function ConsentementCompte({
  consentement,
  onAccepter,
  onRetirer,
}: {
  consentement: string | null;
  onAccepter: () => void;
  onRetirer: () => void;
}): React.ReactElement {
  if (consentement) {
    return (
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        Boussole enregistrée sur votre compte avec votre accord
        (depuis le {new Date(consentement).toLocaleDateString("fr-FR")}).{" "}
        <button type="button" className="ln text-foreground" onClick={onRetirer}>
          Effacer mes réponses de mon compte
        </button>
      </p>
    );
  }
  return (
    <div className="mt-4 max-w-3xl border border-border p-4 text-[14px] leading-relaxed">
      <p className="font-medium">Enregistrer votre Boussole sur votre compte ?</p>
      <p className="mt-1.5 text-muted-foreground">
        Vos réponses peuvent révéler des opinions politiques. Elles ne sont
        enregistrées sur votre compte qu&apos;avec votre accord, ne sont
        jamais publiées ni partagées, et vous pouvez les effacer à tout
        moment. Sans accord, elles restent uniquement sur cet appareil.{" "}
        <Link href="/confidentialite" className="ln text-foreground">
          En savoir plus
        </Link>
      </p>
      <button
        type="button"
        className="btn btn-outline mt-3 h-9"
        onClick={onAccepter}
      >
        J&apos;accepte l&apos;enregistrement sur mon compte
      </button>
    </div>
  );
}
