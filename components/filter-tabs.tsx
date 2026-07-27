import Link from "next/link";

export type TabLink = {
  id: string;
  label: string;
  href: string;
};

type FilterTabsProps = {
  tabs: TabLink[];
  activeId: string;
};

/** Onglets filtre (chambre, type…) avec contrastes light/dark. */
export function FilterTabs({
  tabs,
  activeId,
}: FilterTabsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={
              `inline-flex min-h-10 items-center border px-3 text-sm ` +
              (active
                ? "border-[var(--accent)] bg-[var(--accent-soft)] " +
                  "font-medium text-[var(--ink)]"
                : "border-[var(--border)] bg-[var(--surface)] " +
                  "text-[var(--muted)] hover:border-[var(--accent)]/50 " +
                  "hover:text-[var(--ink)]")
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
