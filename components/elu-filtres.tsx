"use client";

import { useRef } from "react";

type EluFiltresProps = {
  action: string;
  q: string;
  groupe: string;
  groupes: { uid: string; label: string }[];
  placeholder: string;
};

/**
 * Recherche par nom + filtre par groupe (formulaire GET, état dans l'URL).
 * Le choix d'un groupe soumet le formulaire ; sans JavaScript, le bouton suffit.
 */
export function EluFiltres({
  action,
  q,
  groupe,
  groupes,
  placeholder,
}: EluFiltresProps): React.ReactElement {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={action}
      method="get"
      role="search"
      className="flex min-w-0 flex-[1_1_520px] flex-wrap items-center gap-3"
    >
      <label htmlFor="elu-q" className="sr-only">
        Rechercher un élu
      </label>
      <input
        id="elu-q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder={placeholder}
        autoComplete="off"
        className="field min-w-0 flex-[1_1_240px]"
      />
      <label className="inline-flex items-center gap-2.5 text-[15px] text-[#404040] dark:text-muted-foreground">
        Groupe
        <select
          name="groupe"
          defaultValue={groupe}
          onChange={() => formRef.current?.requestSubmit()}
          className="field max-w-[220px] pr-8"
        >
          <option value="">Tous les groupes</option>
          {groupes.map((g) => (
            <option key={g.uid} value={g.uid}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn btn-dark">
        Rechercher
      </button>
    </form>
  );
}
