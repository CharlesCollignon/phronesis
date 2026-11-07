import { formatNumber } from "@/lib/format";

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

const SEGMENTS: {
  key: keyof VoteCounts;
  label: string;
  className: string;
}[] = [
  { key: "pour", label: "Pour", className: "bg-[var(--vote-pour)]" },
  { key: "contre", label: "Contre", className: "bg-[var(--vote-contre)]" },
  {
    key: "abstention",
    label: "Abst.",
    className: "bg-[var(--vote-abstention)]",
  },
  {
    key: "pasAvis",
    label: "Pas d'avis",
    className:
      "bg-[var(--vote-neutre)] shadow-[inset_0_0_0_1px_var(--input)]",
  },
];

function Row({
  label,
  counts,
}: {
  label: string;
  counts: VoteCounts;
}): React.ReactElement {
  const segments = SEGMENTS.filter(
    (s) => s.key !== "pasAvis" || counts.pasAvis !== undefined,
  );
  const total = segments.reduce((acc, s) => acc + (counts[s.key] ?? 0), 0);
  const aria = segments
    .map((s) => `${counts[s.key] ?? 0} ${s.label.toLowerCase()}`)
    .join(", ");

  return (
    <div className="border-t border-border py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-medium">{label}</p>
        <p className="num text-[13px] text-muted-foreground">
          {formatNumber(total)}
        </p>
      </div>
      {total > 0 ? (
        <div
          role="img"
          aria-label={`${label} : ${aria}`}
          className="grow-x mt-2.5 flex h-2 w-full gap-0.5"
        >
          {segments.map((s) => {
            const n = counts[s.key] ?? 0;
            if (n <= 0) return null;
            return (
              <div
                key={s.key}
                className={s.className}
                style={{ width: `${(100 * n) / total}%` }}
                title={`${s.label} ${n}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-2.5 h-2 w-full bg-muted" />
      )}
      <p className="num mt-2 text-[13px] text-[#404040] dark:text-muted-foreground">
        {segments
          .map(
            (s) =>
              `${s.label} ${total > 0 ? Math.round((100 * (counts[s.key] ?? 0)) / total) : 0} %`,
          )
          .join(" · ")}
      </p>
    </div>
  );
}

/** Comparaison députés (scrutin officiel) / citoyens Phronesis (sondage). */
export function VoteComparison({
  deputes,
  citoyens,
  deputesLabel = "Parlementaires (scrutin public)",
  citoyensLabel = "Citoyens Phronesis (sondage)",
}: VoteComparisonProps): React.ReactElement {
  return (
    <div className="border-b border-border">
      <Row label={deputesLabel} counts={deputes} />
      <Row label={citoyensLabel} counts={citoyens} />
    </div>
  );
}
