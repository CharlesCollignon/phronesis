"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { GroupeCouleur } from "@/components/groupe-couleur";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  uid: string;
  label: string;
  /** Sigle du groupe (élus) ou nom court. */
  hint?: string | null;
  /** Couleur du groupe, pour le petit carré devant le sigle. */
  couleur?: string | null;
};

type ComparateurComboboxProps = {
  /** Nom du champ envoyé dans l'URL (`a` ou `b`). */
  name: string;
  label: string;
  options: ComboboxOption[];
  defaultValue?: string;
  placeholder?: string;
};

const MAX_RESULTS = 60;

/** Minuscules sans accents, pour une recherche tolérante. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Liste déroulante avec recherche (motif ARIA combobox). La valeur
 * choisie part dans un champ caché `name`, comme l'ancien <select>.
 */
export function ComparateurCombobox({
  name,
  label,
  options,
  defaultValue = "",
  placeholder = "Rechercher un nom…",
}: ComparateurComboboxProps): React.ReactElement {
  const id = useId();
  const listId = `${id}-liste`;
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = options.find((o) => o.uid === defaultValue) ?? null;
  const [selected, setSelected] = useState<ComboboxOption | null>(initial);
  const [query, setQuery] = useState(initial?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const index = useMemo(
    () =>
      options.map((o) => ({
        o,
        key: normalize(`${o.label} ${o.hint ?? ""}`),
      })),
    [options],
  );

  // Tant que le texte est celui de la sélection, on montre toute la liste.
  const typing = !selected || query !== selected.label;
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!typing || !q) return index.slice(0, MAX_RESULTS).map((x) => x.o);
    const words = q.split(/\s+/);
    return index
      .filter((x) => words.every((w) => x.key.includes(w)))
      .slice(0, MAX_RESULTS)
      .map((x) => x.o);
  }, [index, query, typing]);

  const choose = (o: ComboboxOption): void => {
    setSelected(o);
    setQuery(o.label);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && results[active]) {
        e.preventDefault();
        choose(results[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      if (selected) setQuery(selected.label);
    }
  };

  const activeId = open && results[active] ? `${id}-opt-${active}` : undefined;

  return (
    <div className="relative flex min-w-0 flex-[1_1_280px] flex-col gap-2">
      <label htmlFor={`${id}-input`} className="eyebrow">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          required
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={(e) => {
            setOpen(true);
            e.target.select();
          }}
          onBlur={() => {
            // Laisse le clic sur une option se produire avant de fermer.
            window.setTimeout(() => {
              setOpen(false);
              setQuery((q) => (selected && q !== selected.label ? selected.label : q));
            }, 120);
          }}
          onKeyDown={onKeyDown}
          className="field w-full pr-20"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              aria-label={`Effacer ${label}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSelected(null);
                setQuery("");
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-300",
              open && "rotate-180",
            )}
          />
        </div>
      </div>
      <input type="hidden" name={name} value={selected?.uid ?? ""} />

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="reveal absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto border border-foreground bg-background shadow-[0_18px_36px_-24px_rgba(0,0,0,0.35)]"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-[15px] text-muted-foreground">
              Aucun résultat pour « {query} »
            </li>
          ) : (
            results.map((o, i) => {
              const isSel = selected?.uid === o.uid;
              return (
                <li
                  key={o.uid}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSel}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-[15px] first:border-t-0",
                    i === active && "bg-[var(--hover)]",
                    isSel && "bg-[var(--highlight)] shadow-[inset_3px_0_0_0_var(--accent)]",
                  )}
                >
                  <span className="min-w-0 truncate">{o.label}</span>
                  {o.hint ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground">
                      {o.couleur ? (
                        <GroupeCouleur abrege={o.hint} couleur={o.couleur} size={8} />
                      ) : null}
                      {o.hint}
                    </span>
                  ) : null}
                </li>
              );
            })
          )}
          {results.length === MAX_RESULTS ? (
            <li className="border-t border-border px-4 py-2 text-[13px] text-muted-foreground">
              Affinez la recherche pour voir plus de noms.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
