type SearchFormProps = {
  action?: string;
  placeholder?: string;
  defaultValue?: string;
  compact?: boolean;
};

export function SearchForm({
  action = "/recherche",
  placeholder = "Rechercher une loi, un vote, un député…",
  defaultValue = "",
  compact = false,
}: SearchFormProps): React.ReactElement {
  return (
    <form action={action} method="get" className="w-full">
      <label className="sr-only" htmlFor="q">
        Recherche
      </label>
      <div className={compact ? "flex gap-0" : "flex flex-col gap-2 sm:flex-row"}>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={
            "w-full flex-1 border border-[var(--input-border)] " +
            "bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)] " +
            "outline-none placeholder:text-[var(--muted)] " +
            "focus:border-[var(--accent)]"
          }
        />
        <button
          type="submit"
          className={
            "border border-[var(--input-border)] bg-[var(--surface-muted)] " +
            "px-4 py-2 text-sm font-medium text-[var(--ink)] " +
            "transition hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
          }
        >
          Rechercher
        </button>
      </div>
    </form>
  );
}
