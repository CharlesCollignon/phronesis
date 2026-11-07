"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type GroupeOption = {
  uid: string | null;
  label: string;
};

type VoteFiltersProps = {
  positions: { value: string; label: string; count: number }[];
  groupes: GroupeOption[];
};

/** Filtres de la liste nominative (position, groupe), portés par l'URL. */
export function VoteFilters({
  positions,
  groupes,
}: VoteFiltersProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const position = params.get("position") ?? "";
  const groupe = params.get("groupe") ?? "";

  function update(key: string, value: string): void {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  const tabs = [{ value: "", label: "Toutes", count: null }, ...positions];

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div
        role="group"
        aria-label="Filtrer par position"
        className="flex flex-wrap gap-x-6"
      >
        {tabs.map((p) => {
          const active = position === p.value;
          return (
            <button
              key={p.value || "toutes"}
              type="button"
              aria-pressed={active}
              onClick={() => update("position", p.value)}
              className={cn(
                "relative py-1.5 text-[15px] font-medium transition-colors",
                "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[var(--accent)]",
                "after:transition-transform after:duration-500 after:ease-[var(--spring)]",
                active
                  ? "text-foreground after:origin-left after:scale-x-100"
                  : "text-muted-foreground after:origin-right after:scale-x-0 hover:text-foreground",
              )}
            >
              {p.label}
              {p.count !== null ? (
                <span className="num ml-1.5 text-[13px] font-normal text-muted-foreground">
                  {formatNumber(p.count)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        Groupe
        <select
          value={groupe}
          onChange={(e) => update("groupe", e.target.value)}
          className="field min-w-[160px] pr-8"
        >
          <option value="">Tous les groupes</option>
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
