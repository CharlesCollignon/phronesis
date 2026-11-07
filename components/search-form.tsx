import { Search } from "lucide-react";

type SearchFormProps = {
  action?: string;
  placeholder?: string;
  defaultValue?: string;
  /** Champ standard (listes) ; `large` pour la page de recherche. */
  size?: "default" | "large";
  /** Paramètres à conserver lors de la soumission (filtres actifs). */
  hidden?: Record<string, string>;
  /** Conservé pour compatibilité. */
  compact?: boolean;
};

export function SearchForm({
  action = "/recherche",
  placeholder = "Rechercher une loi, un vote, un élu…",
  defaultValue = "",
  size = "default",
  hidden,
}: SearchFormProps): React.ReactElement {
  if (size === "large") {
    return (
      <form action={action} method="get" role="search" className="relative w-full">
        <label className="sr-only" htmlFor="q">
          Rechercher dans les lois, les scrutins et les élus
        </label>
        <Search
          aria-hidden
          className="absolute left-2.5 top-1/2 size-6 -translate-y-1/2"
          strokeWidth={1.8}
        />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          className="h-[72px] w-full border-0 border-b-2 border-foreground bg-transparent pl-14 pr-4 text-[clamp(22px,2.6vw,34px)] tracking-[-0.015em] outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--accent)]"
        />
        {hidden
          ? Object.entries(hidden).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))
          : null}
      </form>
    );
  }
  return (
    <form action={action} method="get" role="search" className="w-full">
      <label className="sr-only" htmlFor="q">
        Recherche
      </label>
      <div className="flex gap-2">
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="field min-w-0 flex-1"
        />
        {hidden
          ? Object.entries(hidden).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))
          : null}
        <button type="submit" className="btn btn-dark">
          Rechercher
        </button>
      </div>
    </form>
  );
}
