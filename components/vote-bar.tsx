type VoteBarProps = {
  pour: number;
  contre: number;
  abstentions: number;
};

/** Barre de répartition pour / contre / abstentions. */
export function VoteBar({
  pour,
  contre,
  abstentions,
}: VoteBarProps): React.ReactElement {
  const total = pour + contre + abstentions;
  if (total <= 0) {
    return <div className="h-3 w-full bg-[var(--wash)]" />;
  }
  const p = (100 * pour) / total;
  const c = (100 * contre) / total;
  const a = (100 * abstentions) / total;
  return (
    <div
      className="flex h-3 w-full overflow-hidden"
      title={`Pour ${pour} · Contre ${contre} · Abst. ${abstentions}`}
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
