import Link from "next/link";

import { ExternalLink } from "@/components/external-link";
import { formatDateShort } from "@/lib/format";

type TransparencePanelProps = {
  hatvp: {
    hatvpUrl: string;
    qualite: string;
  } | null;
  faits: {
    id: number;
    dateDecision: string | null;
    juridiction: string | null;
    resume: string;
    sourceUrl: string;
    sourceLabel: string;
  }[];
};

/**
 * Bloc minimal de transparence (HATVP + décisions définitives).
 * Pas de score, pas de casier, pas de jugement.
 */
export function TransparencePanel({
  hatvp,
  faits,
}: TransparencePanelProps): React.ReactElement {
  return (
    <aside className="mt-6 border border-border bg-card p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Transparence
      </p>

      {hatvp ? (
        <p className="mt-2">
          <ExternalLink href={hatvp.hatvpUrl}>
            Déclaration HATVP
          </ExternalLink>
          <span className="text-muted-foreground">
            {" "}
            · {hatvp.qualite}
          </span>
        </p>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-medium text-foreground/80">
          Décisions judiciaires publiques (définitives)
        </p>
        {faits.length === 0 ? (
          <p className="mt-1 text-muted-foreground">
            Aucune décision définitive référencée ici
          </p>
        ) : (
          <ul className="mt-1.5 space-y-2">
            {faits.map((f) => (
              <li key={f.id}>
                <p>
                  {f.dateDecision
                    ? `${formatDateShort(f.dateDecision)} · `
                    : ""}
                  {f.juridiction ? `${f.juridiction} · ` : ""}
                  {f.resume}
                </p>
                <ExternalLink href={f.sourceUrl}>
                  {f.sourceLabel}
                </ExternalLink>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Sources officielles uniquement · pas un casier ·
        présomption d&apos;innocence pour tout le reste.{" "}
        <Link
          href="/methodologie"
          className="text-[var(--accent)] hover:underline"
        >
          Méthode
        </Link>
      </p>
    </aside>
  );
}
