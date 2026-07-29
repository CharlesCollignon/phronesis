import type { InferSelectModel } from "drizzle-orm";

import type { documents, resumesIa } from "@/db/schema";
import { formatDateShort } from "@/lib/format";
import { urlDocumentAn } from "@/lib/urls";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink } from "./external-link";

type Resume = InferSelectModel<typeof resumesIa>;
type DocumentRow = InferSelectModel<typeof documents>;

type ResumeDoc = Pick<DocumentRow, "uid" | "titre" | "dateDepot">;

type ResumeIaProps = {
  resume: Resume | null;
  documents?: ResumeDoc[];
};

const LINK_CLASS =
  "font-medium text-primary underline-offset-2 hover:underline";

const DEMO_PREFIX =
  /^Ceci est un résumé de démonstration[^.]*\.\s*/i;

/** Retire le préambule démo redondant avec le sous-titre. */
function cleanContenu(contenu: string): string {
  return contenu.replace(DEMO_PREFIX, "").trim();
}

/**
 * Vulgarisation IA + accès aux sources officielles — un seul bloc.
 */
export function ResumeIa({
  resume,
  documents = [],
}: ResumeIaProps): React.ReactElement {
  const docs = documents.slice(0, 6);

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {resume ? "Vulgarisation (IA)" : "Vulgarisation"}
          </CardTitle>
          {resume ? (
            <p className="text-xs text-muted-foreground">
              {resume.modele} · prompt {resume.promptVersion}
            </p>
          ) : null}
        </div>
        <CardDescription>
          Jamais un substitut au texte officiel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resume ? (
          <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground sm:text-[1.05rem]">
            {cleanContenu(resume.contenu)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun résumé IA n&apos;a encore été généré pour ce
            dossier. Les documents officiels restent disponibles
            ci-dessous.
          </p>
        )}
        {resume && resume.sources.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Sources :{" "}
            {resume.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 ? " · " : null}
                <ExternalLink href={s.url} className={LINK_CLASS}>
                  {s.label}
                </ExternalLink>
              </span>
            ))}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 rounded-none py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documents officiels
        </p>
        {docs.length > 0 ? (
          <ul className="flex flex-col gap-1 text-xs sm:text-sm">
            {docs.map((doc) => (
              <li
                key={doc.uid}
                className="flex flex-wrap items-baseline gap-x-2 leading-snug"
              >
                <ExternalLink
                  href={urlDocumentAn(doc.uid)}
                  className={LINK_CLASS}
                >
                  {doc.titre}
                </ExternalLink>
                {doc.dateDepot ? (
                  <span className="text-muted-foreground">
                    {formatDateShort(doc.dateDepot)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Aucun document lié dans le dump open data.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
