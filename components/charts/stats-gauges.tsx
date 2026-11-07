type StatsGaugesProps = {
  participation: number | null;
  fidelite: number | null;
};

const R = 80;
const LEN = Math.PI * R;

function Gauge({
  value,
  label,
  hint,
}: {
  value: number | null;
  label: string;
  hint: string;
}): React.ReactElement {
  const v = value == null ? null : Math.max(0, Math.min(1, value));
  const pct = v == null ? null : Math.round(v * 100);
  return (
    <figure className="border-t border-foreground pt-5">
      <div className="relative mx-auto max-w-[240px]">
        <svg
          viewBox="0 0 180 100"
          className="block w-full"
          role="img"
          aria-label={`${label} : ${pct == null ? "non disponible" : `${pct} %`}`}
        >
          <path
            d={`M 10 90 A ${R} ${R} 0 0 1 170 90`}
            fill="none"
            stroke="var(--vote-neutre)"
            strokeWidth={12}
          />
          {v != null && v > 0 ? (
            <path
              d={`M 10 90 A ${R} ${R} 0 0 1 170 90`}
              fill="none"
              stroke="var(--foreground)"
              strokeWidth={12}
              strokeDasharray={`${LEN} ${LEN}`}
              strokeDashoffset={LEN * (1 - v)}
              className="gauge-arc"
              style={{ ["--gauge-from" as string]: LEN }}
            />
          ) : null}
        </svg>
        <p className="num absolute inset-x-0 bottom-0 text-center text-[clamp(28px,3vw,36px)] font-medium leading-none tracking-[-0.02em]">
          {pct == null ? "—" : `${pct} %`}
        </p>
      </div>
      <figcaption className="mt-3 text-center">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="mt-1 block text-[13px] text-muted-foreground">
          {hint}
        </span>
      </figcaption>
    </figure>
  );
}

/** Jauges participation / fidélité au groupe, en monochrome. */
export function StatsGauges({
  participation,
  fidelite,
}: StatsGaugesProps): React.ReactElement {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Gauge
        value={participation}
        label="Participation"
        hint="Positions exprimées sur les scrutins où l'élu apparaît"
      />
      <Gauge
        value={fidelite}
        label="Fidélité au groupe"
        hint="Accord avec la position majoritaire du groupe"
      />
      <style>{`
        .gauge-arc { animation: gauge-draw 1.2s var(--spring) both; }
        @keyframes gauge-draw { from { stroke-dashoffset: var(--gauge-from); } }
        @media (prefers-reduced-motion: reduce) { .gauge-arc { animation: none; } }
      `}</style>
    </div>
  );
}
