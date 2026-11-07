import { cn } from "@/lib/utils";

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** Lien sortant vers une source officielle. */
export function ExternalLink({
  href,
  children,
  className,
}: ExternalLinkProps): React.ReactElement {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("ln text-[15px] font-medium", className)}
    >
      {children}
      <span aria-hidden> ↗</span>
    </a>
  );
}
