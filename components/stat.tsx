type StatProps = {
  label: string;
  value: string;
  hint?: string;
};

export function Stat({ label, value, hint }: StatProps): React.ReactElement {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="num mt-1 text-2xl text-[var(--ink)]">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
