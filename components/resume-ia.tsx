import type { InferSelectModel } from "drizzle-orm";

import type { resumesIa } from "@/db/schema";
import { ExternalLink } from "./external-link";

type Resume = InferSelectModel<typeof resumesIa>;

type ResumeIaProps = {
  resume: Resume | null;
  officialHref?: string | null;
  officialLabel?: string;
};

/**
 * Encadré vulgarisation IA — toujours distinct du texte officiel.
 */
export function ResumeIa({
  resume,
  officialHref,
  officialLabel = "Voir le texte officiel",
}: ResumeIaProps): React.ReactElement {
  if (!resume) {
    return (
      <aside className=" border border-dashed border-[var(--ink)]/20 bg-[var(--wash)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Vulgarisation
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Aucun résumé IA n&apos;a encore été généré pour ce dossier.
          Le texte et les documents officiels restent disponibles
          ci-dessous.
        </p>
        {officialHref ? (
          <p className="mt-3">
            <ExternalLink href={officialHref}>{officialLabel}</ExternalLink>
          </p>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className=" border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          Vulgarisation (IA)
        </p>
        <p className="text-xs text-[var(--muted)]">
          {resume.modele} · prompt {resume.promptVersion}
        </p>
      </div>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
        {resume.contenu}
      </div>
      {resume.sources.length > 0 ? (
        <ul className="mt-4 space-y-1 border-t border-[var(--accent)]/20 pt-3 text-xs text-[var(--muted)]">
          {resume.sources.map((s) => (
            <li key={s.url}>
              Source :{" "}
              <ExternalLink href={s.url}>{s.label}</ExternalLink>
            </li>
          ))}
        </ul>
      ) : null}
      {officialHref ? (
        <p className="mt-3">
          <ExternalLink href={officialHref}>{officialLabel}</ExternalLink>
        </p>
      ) : null}
    </aside>
  );
}
