import { cn } from "@/lib/utils";

type VoteBarProps = {
  pour: number;
  contre: number;
  abstentions: number;
  /** Horizontal (défaut) ou bandeau vertical (bordure gauche). */
  orientation?: "horizontal" | "vertical";
  className?: string;
};

/**
 * Répartition pour / contre / abstentions, en monochrome :
 * noir = pour, gris = contre, clair = abstention.
 */
export function VoteBar({
  pour,
  contre,
  abstentions,
  orientation = "horizontal",
  className,
}: VoteBarProps): React.ReactElement {
  const total = pour + contre + abstentions;
  const label =
    `${pour} pour, ${contre} contre, ${abstentions} abstention` +
    (abstentions > 1 ? "s" : "");

  if (orientation === "vertical") {
    if (total <= 0) {
      return (
        <div
          className={className ?? "w-1 shrink-0 self-stretch bg-muted"}
          title={label}
        />
      );
    }
    return (
      <div
        className={
          className ??
          "flex w-1 shrink-0 flex-col self-stretch overflow-hidden"
        }
        title={label}
      >
        <div
          className="w-full bg-[var(--vote-pour)]"
          style={{ flexGrow: pour, flexBasis: 0 }}
        />
        <div
          className="w-full bg-[var(--vote-contre)]"
          style={{ flexGrow: contre, flexBasis: 0 }}
        />
        <div
          className="w-full bg-[var(--vote-abstention)]"
          style={{ flexGrow: abstentions, flexBasis: 0 }}
        />
      </div>
    );
  }

  if (total <= 0) {
    return <div className={cn("h-1.5 w-full bg-muted", className)} />;
  }
  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={cn("grow-x flex h-1.5 w-full gap-0.5", className)}
    >
      {pour > 0 ? (
        <div
          className="bg-[var(--vote-pour)]"
          style={{ width: `${(100 * pour) / total}%` }}
        />
      ) : null}
      {contre > 0 ? (
        <div
          className="bg-[var(--vote-contre)]"
          style={{ width: `${(100 * contre) / total}%` }}
        />
      ) : null}
      {abstentions > 0 ? (
        <div
          className="bg-[var(--vote-abstention)]"
          style={{ width: `${(100 * abstentions) / total}%` }}
        />
      ) : null}
    </div>
  );
}
