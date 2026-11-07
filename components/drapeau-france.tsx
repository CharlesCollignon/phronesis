import { cn } from "@/lib/utils";

/**
 * Drapeau tricolore (bleu, blanc, rouge aux teintes de la charte de
 * l'État), dessiné en CSS pour rester net à toutes les tailles.
 */
export function DrapeauFrance({
  className,
  label,
}: {
  className?: string;
  /** Texte lu par les lecteurs d'écran ; sans label, purement décoratif. */
  label?: string;
}): React.ReactElement {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex h-3 w-[18px] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/25",
        className,
      )}
    >
      <span className="flex-1 bg-[#000091]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#e1000f]" />
    </span>
  );
}
