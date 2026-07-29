type VoteCounts = {
  pour: number;
  contre: number;
  abstention: number;
  pasAvis?: number;
};

type VoteComparisonProps = {
  deputes: VoteCounts;
  citoyens: VoteCounts;
  deputesLabel?: string;
  citoyensLabel?: string;
};

function stackedBar(
  counts: VoteCounts,
  totalOverride?: number,
): React.ReactElement {
  const total =
    totalOverride ??
    counts.pour +
      counts.contre +
      counts.abstention +
      (counts.pasAvis ?? 0);
  const safe = Math.max(total, 1);
  const pPour = (100 * counts.pour) / safe;
  const pContre = (100 * counts.contre) / safe;
  const pAbs = (100 * counts.abstention) / safe;
  const pAvis = (100 * (counts.pasAvis ?? 0)) / safe;

  return (
    <div className="flex h-4 w-full overflow-hidden bg-muted">
      <div
        className="bg-[var(--vote-pour)]"
        style={{ width: `${pPour}%` }}
        title={`Pour ${counts.pour}`}
      />
      <div
        className="bg-[var(--vote-contre)]"
        style={{ width: `${pContre}%` }}
        title={`Contre ${counts.contre}`}
      />
      <div
        className="bg-[var(--vote-abstention)]"
        style={{ width: `${pAbs}%` }}
        title={`Abstention ${counts.abstention}`}
      />
      {(counts.pasAvis ?? 0) > 0 ? (
        <div
          className="bg-[var(--vote-neutre)]"
          style={{ width: `${pAvis}%` }}
          title={`Pas d'avis ${counts.pasAvis}`}
        />
      ) : null}
    </div>
  );
}

function legend(counts: VoteCounts): React.ReactElement {
  return (
    <dl className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
      <div>
        <dt className="text-muted-foreground">Pour</dt>
        <dd className="num text-sm">{counts.pour}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Contre</dt>
        <dd className="num text-sm">{counts.contre}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Abst.</dt>
        <dd className="num text-sm">{counts.abstention}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">
          {(counts.pasAvis ?? 0) > 0 ? "N/A" : "Total"}
        </dt>
        <dd className="num text-sm">
          {(counts.pasAvis ?? 0) > 0
            ? counts.pasAvis
            : counts.pour + counts.contre + counts.abstention}
        </dd>
      </div>
    </dl>
  );
}

/** Comparaison visuelle députés (officiel) vs citoyens Phronesis. */
export function VoteComparison({
  deputes,
  citoyens,
  deputesLabel = "Députés (scrutin public)",
  citoyensLabel = "Citoyens Phronesis (sondage)",
}: VoteComparisonProps): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {deputesLabel}
        </p>
        {stackedBar(deputes)}
        {legend(deputes)}
      </div>
      <div className="border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {citoyensLabel}
        </p>
        {stackedBar(citoyens)}
        {legend(citoyens)}
      </div>
    </div>
  );
}
