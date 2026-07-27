"use client";

import { useRouter, useSearchParams } from "next/navigation";

type GroupeOption = {
  uid: string | null;
  label: string;
};

type VoteFiltersProps = {
  positions: { value: string; label: string; count: number }[];
  groupes: GroupeOption[];
};

export function VoteFilters({
  positions,
  groupes,
}: VoteFiltersProps): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const position = params.get("position") ?? "";
  const groupe = params.get("groupe") ?? "";

  function update(key: string, value: string): void {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
        Position
        <select
          value={position}
          onChange={(e) => update("position", e.target.value)}
          className=" border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
        >
          <option value="">Toutes</option>
          {positions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} ({p.count})
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
        Groupe
        <select
          value={groupe}
          onChange={(e) => update("groupe", e.target.value)}
          className=" border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
        >
          <option value="">Tous</option>
          {groupes
            .filter((g) => g.uid)
            .map((g) => (
              <option key={g.uid!} value={g.uid!}>
                {g.label}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
