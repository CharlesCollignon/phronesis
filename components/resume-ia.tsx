"use client";

import type { InferSelectModel } from "drizzle-orm";
import { useState } from "react";

import { ExternalLink } from "@/components/external-link";
import type { documents, resumesIa } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { urlDocumentAn } from "@/lib/urls";
import { cn } from "@/lib/utils";

type Resume = InferSelectModel<typeof resumesIa>;
type DocumentRow = InferSelectModel<typeof documents>;

type ResumeDoc = Pick<DocumentRow, "uid" | "titre" | "dateDepot">;

type ResumeIaProps = {
  resume: Resume | null;
  documents?: ResumeDoc[];
  /** Lien vers le dossier officiel (onglet « Texte officiel »). */
  officialHref?: string | null;
};

type Tab = "resume" | "officiel";

const DEMO_PREFIX = /^Ceci est un résumé de démonstration[^.]*\.\s*/i;
/** Intertitre redondant avec le titre de la section. */
const TITLE_PREFIX = /^\*\*De quoi s[’']agit-il\s*\?\*\*:?\s*/i;

/** Retire le préambule démo redondant avec le sous-titre. */
function cleanContenu(contenu: string): string {
  return contenu.replace(DEMO_PREFIX, "").trim().replace(TITLE_PREFIX, "");
}

/** `**gras**` en ligne → <strong>. */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

/**
 * Rendu sobre du résumé : intertitres `**…**` seuls sur leur ligne,
 * listes `- …`, paragraphes. Aucun HTML injecté.
 */
function ResumeBody({ contenu }: { contenu: string }): React.ReactElement {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];

  const flushList = (): void => {
    if (list.length === 0) return;
    const items = list;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="mt-3 flex list-disc flex-col gap-2 pl-5 marker:text-muted-foreground"
      >
        {items.map((li, i) => (
          <li key={i}>{inline(li)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  const flushPara = (): void => {
    if (para.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="mt-3">
        {inline(para.join(" "))}
      </p>,
    );
    para = [];
  };

  for (const raw of contenu.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushPara();
      continue;
    }
    const heading = /^\*\*(.+)\*\*:?$/.exec(line) ?? /^#{1,4}\s+(.+)$/.exec(line);
    if (heading?.[1]) {
      flushList();
      flushPara();
      blocks.push(
        <h3
          key={`h-${blocks.length}`}
          className="mt-6 text-[17px] font-semibold first:mt-0"
        >
          {heading[1]}
        </h3>,
      );
      continue;
    }
    const item = /^[-*•]\s+(.+)$/.exec(line);
    if (item?.[1]) {
      flushPara();
      list.push(item[1]);
      continue;
    }
    flushList();
    para.push(line);
  }
  flushList();
  flushPara();

  return <div className="[&>*:first-child]:mt-0">{blocks}</div>;
}

/**
 * « De quoi s'agit-il ? » : résumé de vulgarisation (IA) et accès au
 * texte officiel, en deux onglets. Le résumé ne remplace jamais le texte.
 */
export function ResumeIa({
  resume,
  documents = [],
  officialHref,
}: ResumeIaProps): React.ReactElement {
  const [tab, setTab] = useState<Tab>(resume ? "resume" : "officiel");
  const docs = documents.slice(0, 6);

  const tabs: { id: Tab; label: string }[] = [
    { id: "resume", label: "Résumé clair" },
    { id: "officiel", label: "Texte officiel" },
  ];

  return (
    <section aria-labelledby="resume-titre">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground pb-4">
        <h2
          id="resume-titre"
          className="text-[clamp(22px,2.2vw,28px)] font-semibold leading-tight tracking-[-0.015em]"
        >
          De quoi s&apos;agit-il ?
        </h2>
        <div
          role="tablist"
          aria-label="Version"
          className="inline-flex border border-foreground"
        >
          {tabs.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "h-9 px-3.5 text-sm font-medium transition-colors duration-300",
                  on
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-[var(--hover)]",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "resume" ? (
        <div
          key="resume"
          id="panel-resume"
          role="tabpanel"
          aria-labelledby="tab-resume"
          className="reveal pt-5"
        >
          {resume ? (
            <>
              <div className="max-w-3xl text-[17px] leading-[1.7]">
                <ResumeBody contenu={cleanContenu(resume.contenu)} />
              </div>
              {resume.sources.length > 0 ? (
                <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">Sources</span>
                  {resume.sources.map((s) => (
                    <ExternalLink
                      key={s.url}
                      href={s.url}
                      className="inline-block max-w-full truncate align-bottom text-sm"
                    >
                      {s.label}
                    </ExternalLink>
                  ))}
                </p>
              ) : null}
              <p className="mt-5 border-t border-border pt-3.5 text-[13px] text-muted-foreground">
                Résumé généré par IA ({resume.modele} · prompt{" "}
                {resume.promptVersion}) à partir des documents du dossier.
                Il ne remplace pas le texte officiel.
              </p>
            </>
          ) : (
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              Aucun résumé n&apos;a encore été généré pour ce dossier. Les
              documents officiels restent disponibles dans l&apos;onglet
              « Texte officiel ».
            </p>
          )}
        </div>
      ) : (
        <div
          key="officiel"
          id="panel-officiel"
          role="tabpanel"
          aria-labelledby="tab-officiel"
          className="reveal pt-5"
        >
          {docs.length > 0 ? (
            <ul className="border-b border-border">
              {docs.map((doc) => (
                <li
                  key={doc.uid}
                  className="grid gap-x-6 gap-y-1 border-t border-border py-3.5 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_120px]"
                >
                  <ExternalLink
                    href={urlDocumentAn(doc.uid)}
                    className="justify-self-start text-[15px] leading-snug"
                  >
                    {doc.titre}
                  </ExternalLink>
                  {doc.dateDepot ? (
                    <span className="num text-sm text-muted-foreground sm:text-right">
                      {formatDate(doc.dateDepot)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-muted-foreground">
              Aucun document lié dans le dump open data.
            </p>
          )}
          {officialHref ? (
            <p className="mt-5 text-[15px]">
              <ExternalLink href={officialHref}>
                Lire le dossier sur assemblee-nationale.fr
              </ExternalLink>
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
