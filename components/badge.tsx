import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "pour"
  | "contre"
  | "abstention"
  | "adopte"
  | "rejete";

type BadgeProps = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

/**
 * Positions (pour / contre / abstention) : étiquettes monochromes.
 * Sorts (adopté / rejeté) : pastille + libellé, jamais rouge / vert.
 */
const PILL: Partial<Record<Tone, string>> = {
  neutral: "border border-border text-muted-foreground",
  pour: "bg-[var(--vote-pour)] text-background",
  contre: "border-[1.5px] border-foreground text-foreground",
  abstention: "bg-[var(--vote-abstention)] text-foreground",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: BadgeProps): React.ReactElement {
  if (tone === "adopte" || tone === "rejete") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap",
          className,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            tone === "adopte"
              ? "bg-foreground"
              : "border-[1.5px] border-foreground",
          )}
        />
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center px-2.5 text-[13px] font-semibold whitespace-nowrap",
        PILL[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
