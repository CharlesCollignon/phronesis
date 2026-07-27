type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** Lien sortant vers une source officielle. */
export function ExternalLink({
  href,
  children,
  className = "",
}: ExternalLinkProps): React.ReactElement {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        className ||
        "inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
      }
    >
      {children}
      <span aria-hidden className="text-xs">
        ↗
      </span>
    </a>
  );
}
