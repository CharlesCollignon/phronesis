import Link from "next/link";

import { cn } from "@/lib/utils";

export type TabLink = {
  id: string;
  label: React.ReactNode;
  href: string;
};

type FilterTabsProps = {
  tabs: TabLink[];
  activeId: string;
  /**
   * `underline` : filtres texte soulignés de jaune (par défaut).
   * `segmented` : bascule noire (chambre, mode…).
   */
  variant?: "underline" | "segmented";
  label?: string;
  className?: string;
};

/** Onglets-filtres sous forme de liens (état porté par l'URL). */
export function FilterTabs({
  tabs,
  activeId,
  variant = "underline",
  label,
  className,
}: FilterTabsProps): React.ReactElement {
  if (variant === "segmented") {
    return (
      <div
        role="group"
        aria-label={label}
        className={cn("inline-flex border border-foreground", className)}
      >
        {tabs.map((tab) => {
          const active = activeId === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-11 items-center px-4 text-[15px] font-medium",
                "transition-colors duration-300",
                active
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-[var(--hover)]",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    );
  }
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap gap-x-6", className)}
    >
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={active ? "true" : undefined}
            className={cn(
              "relative py-1.5 text-[15px] font-medium transition-colors",
              "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[var(--accent)]",
              "after:transition-transform after:duration-500 after:ease-[var(--spring)]",
              active
                ? "text-foreground after:origin-left after:scale-x-100"
                : "text-muted-foreground after:origin-right after:scale-x-0 hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
