import Link from "next/link";

import { cn } from "@/lib/utils";

export type TabLink = {
  id: string;
  label: string;
  href: string;
};

type FilterTabsProps = {
  tabs: TabLink[];
  activeId: string;
};

/** Onglets filtre (chambre, type…) — liens stylés shadcn. */
export function FilterTabs({
  tabs,
  activeId,
}: FilterTabsProps): React.ReactElement {
  return (
    <div
      role="tablist"
      className="inline-flex flex-wrap gap-0 border border-border"
    >
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "inline-flex min-h-10 items-center px-3 text-sm",
              "border-r border-border last:border-r-0",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
