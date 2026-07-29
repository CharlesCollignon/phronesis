import { Badge as UiBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "pour" | "contre" | "abstention" | "adopte" | "rejete";
  className?: string;
};

const TONES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-border bg-muted text-foreground",
  pour:
    "border-transparent bg-emerald-100 text-emerald-900 " +
    "dark:bg-emerald-950 dark:text-emerald-200",
  contre:
    "border-transparent bg-rose-100 text-rose-900 " +
    "dark:bg-rose-950 dark:text-rose-200",
  abstention:
    "border-transparent bg-amber-100 text-amber-900 " +
    "dark:bg-amber-950 dark:text-amber-200",
  adopte:
    "border-transparent bg-emerald-100 text-emerald-900 " +
    "dark:bg-emerald-950 dark:text-emerald-200",
  rejete:
    "border-transparent bg-rose-100 text-rose-900 " +
    "dark:bg-rose-950 dark:text-rose-200",
};

/** Badge métier Phronesis (votes / sorts) au-dessus de shadcn. */
export function Badge({
  children,
  tone = "neutral",
  className,
}: BadgeProps): React.ReactElement {
  return (
    <UiBadge
      variant="outline"
      className={cn("rounded-none", TONES[tone], className)}
    >
      {children}
    </UiBadge>
  );
}
