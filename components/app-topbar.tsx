import { NotificationsBell } from "@/components/notifications-bell";
import { SearchForm } from "@/components/search-form";

/** Barre supérieure : recherche + notifications. */
export function AppTopbar(): React.ReactElement {
  return (
    <header
      className={
        "sticky top-0 z-30 border-b border-[var(--topbar-border)] " +
        "bg-[var(--topbar)] px-4 py-2 md:px-6"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <p className="hidden shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--muted)] sm:block">
          Recherche
        </p>
        <div className="min-w-0 flex-1">
          <SearchForm compact />
        </div>
        <NotificationsBell />
      </div>
    </header>
  );
}
