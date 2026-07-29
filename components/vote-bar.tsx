type VoteBarProps = {
  pour: number;
  contre: number;
  abstentions: number;
  /** Horizontal (défaut) ou bandeau vertical (bordure gauche). */
  orientation?: "horizontal" | "vertical";
  className?: string;
};

/** Barre de répartition pour / contre / abstentions. */
export function VoteBar({
  pour,
  contre,
  abstentions,
  orientation = "horizontal",
  className,
}: VoteBarProps): React.ReactElement {
  const total = pour + contre + abstentions;
  const title =
    `Pour ${pour} · Contre ${contre} · Abst. ${abstentions}`;

  if (orientation === "vertical") {
    if (total <= 0) {
      return (
        <div
          className={className ?? "w-1 shrink-0 self-stretch bg-muted"}
          title={title}
        />
      );
    }
    const p = (100 * pour) / total;
    const c = (100 * contre) / total;
    const a = (100 * abstentions) / total;
    return (
      <div
        className={
          className ??
          "flex w-1 shrink-0 flex-col self-stretch overflow-hidden"
        }
        title={title}
      >
        <div
          className="w-full bg-[var(--vote-pour)]"
          style={{ flexGrow: p, flexBasis: 0 }}
        />
        <div
          className="w-full bg-[var(--vote-contre)]"
          style={{ flexGrow: c, flexBasis: 0 }}
        />
        <div
          className="w-full bg-[var(--vote-abstention)]"
          style={{ flexGrow: a, flexBasis: 0 }}
        />
      </div>
    );
  }

  if (total <= 0) {
    return <div className="h-3 w-full bg-muted" />;
  }
  const p = (100 * pour) / total;
  const c = (100 * contre) / total;
  const a = (100 * abstentions) / total;
  return (
    <div
      className="flex h-3 w-full overflow-hidden"
      title={title}
    >
      <div className="bg-[var(--vote-pour)]" style={{ width: `${p}%` }} />
      <div className="bg-[var(--vote-contre)]" style={{ width: `${c}%` }} />
      <div
        className="bg-[var(--vote-abstention)]"
        style={{ width: `${a}%` }}
      />
    </div>
  );
}
