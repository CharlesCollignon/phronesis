type BadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "pour" | "contre" | "abstention" | "adopte" | "rejete";
};

const TONES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-[var(--wash)] text-[var(--ink)]",
  pour: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  contre: "bg-[var(--danger-bg)] text-[var(--danger-fg)]",
  abstention: "bg-[var(--warn-bg)] text-[var(--warn-fg)]",
  adopte: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  rejete: "bg-[var(--danger-bg)] text-[var(--danger-fg)]",
};

export function Badge({
  children,
  tone = "neutral",
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={
        `inline-flex items-center px-2 py-0.5 text-xs font-medium ` +
        TONES[tone]
      }
    >
      {children}
    </span>
  );
}
