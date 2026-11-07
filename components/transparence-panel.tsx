import Link from "next/link";

import { ExternalLink } from "@/components/external-link";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  className?: string;
};

/**
 * Bloc minimal de transparence (HATVP + décisions définitives).
 * Pas de score, pas de casier, pas de jugement.
 */
export function TransparencePanel({
  hatvp,
  faits,
  className,
}: TransparencePanelProps): React.ReactElement {
  return (
    <section
      aria-labelledby="transparence-titre"
      className={cn("border-t border-foreground pt-5", className)}
    >
      <h2 id="transparence-titre" className="eyebrow">
        Transparence
      </h2>

      <dl className="mt-4 grid gap-4 text-[15px]">
        <div>
          <dt className="text-sm text-muted-foreground">
            Déclarations d&apos;intérêts et de patrimoine
          </dt>
          <dd className="mt-1">
            {hatvp ? (
              <>
                <ExternalLink href={hatvp.hatvpUrl}>
                  Déclaration HATVP
                </ExternalLink>
                <span className="text-muted-foreground">
                  {" "}
                  · {hatvp.qualite}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                Aucune fiche HATVP rattachée
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">
            Décisions judiciaires publiques (définitives)
          </dt>
          <dd className="mt-1">
            {faits.length === 0 ? (
              <span className="text-muted-foreground">
                Aucune décision définitive référencée ici
              </span>
            ) : (
              <ul className="border-b border-border">
                {faits.map((f) => (
                  <li
                    key={f.id}
                    className="border-t border-border py-3 leading-relaxed"
                  >
                    <p className="num text-[13px] text-muted-foreground">
                      {[
                        f.dateDecision
                          ? formatDateShort(f.dateDecision)
                          : null,
                        f.juridiction,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1">{f.resume}</p>
                    <p className="mt-1.5">
                      <ExternalLink
                        href={f.sourceUrl}
                        className="text-sm"
                      >
                        {f.sourceLabel}
                      </ExternalLink>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
        Sources officielles uniquement · pas un casier · présomption
        d&apos;innocence pour tout le reste.{" "}
        <Link href="/methodologie" className="ln text-foreground">
          Méthode
        </Link>
      </p>
    </section>
  );
}
