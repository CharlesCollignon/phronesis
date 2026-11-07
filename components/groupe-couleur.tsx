import { couleurGroupe } from "@/lib/spectre-groupes";
import { cn } from "@/lib/utils";

/** Couleur officielle du groupe (AMO), avec repli par sigle. */
export function couleurDe(
  abrege: string | null | undefined,
  couleur: string | null | undefined,
): string {
  return couleurGroupe(abrege, couleur);
}

/** Texte noir ou blanc selon la luminance du fond (WCAG). */
export function texteSur(hex: string): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contraste avec le blanc vs avec le noir : on prend le meilleur.
  return (1.05 / (lum + 0.05) >= (lum + 0.05) / 0.05) ? "#FFFFFF" : "#0A0A0A";
}

type GroupeCouleurProps = {
  abrege: string | null | undefined;
  couleur: string | null | undefined;
  /** Côté du carré, en pixels. */
  size?: number;
  className?: string;
};

/** Petit carré à la couleur du groupe, placé devant son sigle. */
export function GroupeCouleur({
  abrege,
  couleur,
  size = 10,
  className,
}: GroupeCouleurProps): React.ReactElement {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: couleurDe(abrege, couleur),
      }}
    />
  );
}

type GroupeSigleProps = GroupeCouleurProps & {
  children?: React.ReactNode;
};

/** Sigle précédé de la couleur du groupe. */
export function GroupeSigle({
  abrege,
  couleur,
  size = 10,
  className,
  children,
}: GroupeSigleProps): React.ReactElement {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <GroupeCouleur abrege={abrege} couleur={couleur} size={size} />
      <span className="min-w-0 truncate">{children ?? abrege ?? "—"}</span>
    </span>
  );
}
