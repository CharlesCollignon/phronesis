import Link from "next/link";

import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({
  items,
}: BreadcrumbsProps): React.ReactElement {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden>/</span> : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    last && "text-foreground",
                    "line-clamp-1",
                  )}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Conteneur de page : largeur et gouttières communes à tout le site. */
export const PAGE_WRAP =
  "mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-12";

type PageShellProps = {
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
  /** Conservé pour compatibilité ; l'espacement est désormais unique. */
  compact?: boolean;
};

/** Enveloppe page : fil d'Ariane + contenu. */
export function PageShell({
  breadcrumbs,
  children,
}: PageShellProps): React.ReactElement {
  return (
    <div className={cn(PAGE_WRAP, "pb-28 pt-10")}>
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-7">{children}</div>
    </div>
  );
}

type PageHeaderProps = {
  /** Petite ligne en capitales au-dessus du titre. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Bloc aligné à droite (méta-données, actions, onglets…). */
  aside?: React.ReactNode;
  /** Titre plus petit pour les fiches au long intitulé. */
  size?: "default" | "long";
  className?: string;
};

/** En-tête de page : surtitre, titre, chapeau, bloc latéral. */
export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
  size = "default",
  className,
}: PageHeaderProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-6",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl flex-[1_1_560px]">
        {eyebrow ? <p className="eyebrow rise">{eyebrow}</p> : null}
        <h1
          className={cn(
            "rise font-medium tracking-[-0.025em]",
            eyebrow && "mt-3",
            size === "long"
              ? "text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
              : "text-[clamp(34px,3.8vw,50px)] leading-[1.08]",
          )}
          style={{ animationDelay: "60ms" }}
        >
          {title}
        </h1>
        {description ? (
          <div
            className="rise mt-4 text-lg leading-relaxed text-[#404040] dark:text-muted-foreground"
            style={{ animationDelay: "110ms" }}
          >
            {description}
          </div>
        ) : null}
      </div>
      {aside ? (
        <div className="rise" style={{ animationDelay: "160ms" }}>
          {aside}
        </div>
      ) : null}
    </div>
  );
}

type SectionHeadingProps = {
  title: React.ReactNode;
  /** Texte ou action à droite du titre. */
  aside?: React.ReactNode;
  /** Filet noir sous le titre (sections de fiche). */
  rule?: boolean;
  id?: string;
  className?: string;
};

/** Titre de section : titre à gauche, complément à droite. */
export function SectionHeading({
  title,
  aside,
  rule = false,
  id,
  className,
}: SectionHeadingProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-3 pb-4",
        rule && "border-b border-foreground",
        className,
      )}
    >
      <h2
        id={id}
        className="text-[clamp(22px,2.2vw,28px)] font-semibold leading-tight tracking-[-0.015em]"
      >
        {title}
      </h2>
      {aside ? (
        <div className="text-sm text-muted-foreground">{aside}</div>
      ) : null}
    </div>
  );
}
