import { AXE_BOUSSOLE_HINTS } from "@/lib/axes-boussole-fondements";
import {
  AXE_BOUSSOLE_LABELS,
  AXES_BOUSSOLE,
  type ProfilBoussole,
} from "@/lib/dilemmes";
import { cn } from "@/lib/utils";

type RadarProfilProps = {
  profil: ProfilBoussole;
  /** Libellé accessibilité. */
  ariaLabel?: string;
  className?: string;
};

/** Radar des 10 axes Boussole (valeurs −1 … +1), monochrome. */
export function RadarProfil({
  profil,
  ariaLabel = "Profil des valeurs",
  className = "mx-auto w-full max-w-sm",
}: RadarProfilProps): React.ReactElement {
  const size = 280;
  // Marge latérale : les libellés longs (« Intervention de l'État »)
  // débordent du carré.
  const padX = 70;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const n = AXES_BOUSSOLE.length;
  // Arrondi : évite les écarts d'hydratation entre Node et navigateur.
  const rd = (v: number): number => Math.round(v * 100) / 100;

  const points = AXES_BOUSSOLE.map((axe, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const value = (profil[axe] + 1) / 2;
    const rr = r * Math.max(0.05, value);
    return [rd(cx + rr * Math.cos(angle)), rd(cy + rr * Math.sin(angle))];
  });

  const poly = points.map((p) => p.join(",")).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((scale) =>
    AXES_BOUSSOLE.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const rr = r * scale;
      return `${rd(cx + rr * Math.cos(angle))},${rd(cy + rr * Math.sin(angle))}`;
    }).join(" "),
  );

  return (
    <svg
      viewBox={`${-padX} 0 ${size + 2 * padX} ${size}`}
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
          strokeOpacity={0.12}
        />
      ))}
      {AXES_BOUSSOLE.map((axe, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const cos = Math.cos(angle);
        const lx = rd(cx + (r + 12) * cos);
        const ly = rd(cy + (r + 14) * Math.sin(angle));
        const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
        return (
          <g key={axe}>
            <line
              x1={cx}
              y1={cy}
              x2={rd(cx + r * Math.cos(angle))}
              y2={rd(cy + r * Math.sin(angle))}
              stroke="currentColor"
              strokeOpacity={0.15}
            />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-muted-foreground text-[13px]"
            >
              {AXE_BOUSSOLE_LABELS[axe]}
            </text>
          </g>
        );
      })}
      <polygon
        points={poly}
        fill="currentColor"
        fillOpacity={0.08}
        stroke="currentColor"
        strokeWidth="1.5"
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

function signed(v: number): string {
  const n = Math.round(v * 100);
  if (n === 0) return "0";
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}

/**
 * Barre divergente : centre = 0, à droite (plein) = axe valorisé,
 * à gauche (plus clair) = axe minoré. Utilise currentColor, donc
 * lisible sur fond clair comme sur un bloc noir.
 */
function DivergingBar({
  value,
  variant,
  delay,
}: {
  value: number;
  variant: "solid" | "outline";
  delay: number;
}): React.ReactElement {
  const v = Math.max(-1, Math.min(1, value));
  const pct = Math.abs(v) * 50;
  const positive = v >= 0;
  return (
    <span
      className={cn(
        "relative block",
        variant === "solid" ? "h-2.5" : "h-1.5",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 bg-current opacity-[0.07]"
      />
      <span
        aria-hidden
        className="absolute -inset-y-1 left-1/2 w-px bg-current opacity-50"
      />
      {pct > 0 ? (
        <span
          aria-hidden
          className={cn(
            "grow-x absolute inset-y-0",
            variant === "solid"
              ? positive
                ? "bg-current"
                : "bg-current opacity-40"
              : "border-[1.5px] border-current",
          )}
          style={{
            left: positive ? "50%" : `${50 - pct}%`,
            width: `${pct}%`,
            transformOrigin: positive ? "left" : "right",
            animationDelay: `${delay}ms`,
          }}
        />
      ) : null}
    </span>
  );
}

/** Barres divergentes par axe (−1 … +1) ; second profil optionnel. */
export function AxesBars({
  profil,
  compare,
  profilLabel = "Profil",
  compareLabel = "Comparaison",
  axes = AXES_BOUSSOLE,
  showHints = true,
}: AxesBarsProps): React.ReactElement {
  const cols = compare
    ? "grid-cols-[minmax(0,100px)_minmax(0,1fr)_76px] sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_84px]"
    : "grid-cols-[minmax(0,110px)_minmax(0,1fr)_40px] sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_44px]";
  return (
    <div>
      {compare ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 pb-3 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-2.5 w-5 bg-current" />
            {profilLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-1.5 w-5 border-[1.5px] border-current"
            />
            {compareLabel}
          </span>
        </div>
      ) : null}
      <ul className="border-b border-current/15">
        {axes.map((axe, i) => (
          <li
            key={axe}
            className={cn(
              "grid items-center gap-x-4 gap-y-1 border-t border-current/15 py-2.5",
              cols,
            )}
          >
            <span className="text-[15px] leading-snug">
              {AXE_BOUSSOLE_LABELS[axe]}
            </span>
            <span
              className="flex flex-col gap-1.5"
              role="img"
              aria-label={
                compare
                  ? `${AXE_BOUSSOLE_LABELS[axe]} : ${profilLabel} ${signed(profil[axe])}, ${compareLabel} ${signed(compare[axe])}`
                  : `${AXE_BOUSSOLE_LABELS[axe]} : ${signed(profil[axe])}`
              }
            >
              <DivergingBar
                value={profil[axe]}
                variant="solid"
                delay={i * 50}
              />
              {compare ? (
                <DivergingBar
                  value={compare[axe]}
                  variant="outline"
                  delay={i * 50 + 120}
                />
              ) : null}
            </span>
            <span className="num text-right text-sm font-semibold">
              {signed(profil[axe])}
              {compare ? (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  / {signed(compare[axe])}
                </span>
              ) : null}
            </span>
            {showHints ? (
              <span className="col-span-3 text-[13px] leading-snug text-muted-foreground">
                {AXE_BOUSSOLE_HINTS[axe]}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <div
        aria-hidden
        className={cn("mt-2 grid gap-x-4 text-[12px] text-muted-foreground", cols)}
      >
        <span />
        <span className="flex justify-between">
          <span>← minoré</span>
          <span>valorisé →</span>
        </span>
        <span />
      </div>
    </div>
  );
}
