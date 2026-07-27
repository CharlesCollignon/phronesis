/** Drapeau FR minimal (cocarde rectangulaire). */
export function FlagFr({
  className = "h-3.5 w-5",
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      aria-label="France"
      role="img"
    >
      <rect width="10" height="20" fill="#002654" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#CE1126" />
    </svg>
  );
}
