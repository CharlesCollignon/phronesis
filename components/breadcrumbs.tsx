import Link from "next/link";

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
      <ol className="flex flex-wrap items-center gap-1 text-[var(--muted)]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? (
                <span aria-hidden className="text-[var(--border)]">
                  /
                </span>
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="hover:text-[var(--accent-ink)] hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={last ? "text-[var(--ink)]" : undefined}
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

type PageShellProps = {
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
  compact?: boolean;
};

/** Enveloppe page : fil d'Ariane + contenu. */
export function PageShell({
  breadcrumbs,
  children,
  compact = false,
}: PageShellProps): React.ReactElement {
  return (
    <div
      className={
        `mx-auto max-w-6xl px-4 sm:px-6 ` +
        (compact ? "py-6" : "py-8")
      }
    >
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-4">{children}</div>
    </div>
  );
}
