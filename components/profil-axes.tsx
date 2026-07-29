import { AXE_BOUSSOLE_HINTS } from "@/lib/axes-boussole-fondements";
import {
  AXE_BOUSSOLE_LABELS,
  AXES_BOUSSOLE,
  type ProfilBoussole,
} from "@/lib/dilemmes";

type RadarProfilProps = {
  profil: ProfilBoussole;
  /** Libellé accessibilité. */
  ariaLabel?: string;
  className?: string;
};

/** Radar des 10 axes Boussole (valeurs −1 … +1). */
export function RadarProfil({
  profil,
  ariaLabel = "Profil des valeurs",
  className = "mx-auto w-full max-w-xs",
}: RadarProfilProps): React.ReactElement {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = AXES_BOUSSOLE.length;

  const points = AXES_BOUSSOLE.map((axe, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const value = (profil[axe] + 1) / 2;
    const rr = r * Math.max(0.05, value);
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)];
  });

  const poly = points.map((p) => p.join(",")).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((scale) => {
    const ring = AXES_BOUSSOLE.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const rr = r * scale;
      return `${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`;
    }).join(" ");
    return ring;
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      {grid.map((ring) => (
        <polygon
          key={ring}
          points={ring}
          fill="none"
          stroke="currentColor"
          className="text-foreground/15"
        />
      ))}
      {AXES_BOUSSOLE.map((axe, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + (r + 18) * Math.cos(angle);
        const ly = cy + (r + 18) * Math.sin(angle);
        return (
          <g key={axe}>
            <line
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              className="stroke-[var(--foreground)]/20"
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--muted)] text-[9px]"
            >
              {AXE_BOUSSOLE_LABELS[axe]}
            </text>
          </g>
        );
      })}
      <polygon
        points={poly}
        className="fill-[var(--accent)]/25 stroke-[var(--accent)]"
        strokeWidth="2"
      />
    </svg>
  );
}

type AxesBarsProps = {
  profil: ProfilBoussole;
  /** Second profil superposé (ex. projection loi). */
  compare?: ProfilBoussole;
  profilLabel?: string;
  compareLabel?: string;
  /** N'afficher que certains axes (résonance partielle). */
  axes?: readonly (keyof ProfilBoussole)[];
  showHints?: boolean;
};

/** Barres horizontales par axe ; overlay optionnel. */
export function AxesBars({
  profil,
  compare,
  profilLabel = "Profil",
  compareLabel = "Comparaison",
  axes = AXES_BOUSSOLE,
  showHints = true,
}: AxesBarsProps): React.ReactElement {
  return (
    <ul className="space-y-3">
      {compare ? (
        <li className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 bg-[var(--accent)]" />
            {profilLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 bg-foreground/35" />
            {compareLabel}
          </span>
        </li>
      ) : null}
      {axes.map((axe) => (
        <li key={axe} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="font-medium">
              {AXE_BOUSSOLE_LABELS[axe]}
            </span>
            <span className="text-muted-foreground">
              {(profil[axe] * 100).toFixed(0)}
              {compare != null
                ? ` / ${(compare[axe] * 100).toFixed(0)}`
                : ""}
            </span>
          </div>
          {showHints ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {AXE_BOUSSOLE_HINTS[axe]}
            </p>
          ) : null}
          <div className="relative mt-1.5 h-1.5 overflow-hidden bg-foreground/10">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--accent)]"
              style={{
                width: `${((profil[axe] + 1) / 2) * 100}%`,
              }}
            />
          </div>
          {compare != null ? (
            <div className="relative mt-1 h-1 overflow-hidden bg-foreground/10">
              <div
                className="absolute inset-y-0 left-0 bg-foreground/40"
                style={{
                  width: `${((compare[axe] + 1) / 2) * 100}%`,
                }}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
