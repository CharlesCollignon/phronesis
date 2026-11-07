import { formatNumber } from "@/lib/format";

type AccordGaugeProps = {
  taux: number | null;
  /** Scrutins où les deux positions sont identiques. */
  accords?: number;
  /** Scrutins où les deux se sont exprimés. */
  compares?: number;
  /** « les deux députés », « les deux groupes »… */
  sujet?: string;
};

/** Taux d'accord : grand chiffre sur bloc noir, barre jaune. */
export function AccordGauge({
  taux,
  accords,
  compares,
  sujet = "les deux",
}: AccordGaugeProps): React.ReactElement {
  const pct = taux == null ? null : Math.max(0, Math.min(1, taux)) * 100;
  const label =
    pct == null
      ? "—"
      : pct.toLocaleString("fr-FR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

  return (
    <section
      aria-label="Taux d'accord"
      className="flex flex-wrap items-end justify-between gap-8 bg-[#0a0a0a] p-[clamp(24px,4vw,40px)] text-white"
    >
      <div>
        <p className="eyebrow text-[#a3a3a3]">Même position</p>
        <p className="num mt-2.5 text-[clamp(56px,7vw,88px)] font-medium leading-none tracking-[-0.03em]">
          {label}
          {pct != null ? (
            <span className="text-[0.45em] text-[#a3a3a3]"> %</span>
          ) : null}
        </p>
      </div>
      <div className="min-w-0 flex-[1_1_380px]">
        <p className="num text-[17px] leading-relaxed text-[#e5e5e5]">
          {compares != null && compares > 0 ? (
            <>
              Même position sur{" "}
              <strong className="font-semibold text-white">
                {formatNumber(accords ?? 0)}
              </strong>{" "}
              des{" "}
              <strong className="font-semibold text-white">
                {formatNumber(compares)}
              </strong>{" "}
              scrutins publics où {sujet} se sont exprimés.
            </>
          ) : (
            <>Aucun scrutin public où {sujet} se sont exprimés.</>
          )}
        </p>
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct == null ? 0 : Math.round(pct)}
          aria-label="Taux d'accord"
          className="mt-4 h-2.5 bg-[#333333]"
        >
          {pct != null ? (
            <div
              className="grow-x h-full bg-[var(--accent)]"
              style={{ width: `${pct}%` }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
