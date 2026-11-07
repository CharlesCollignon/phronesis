type StatProps = {
  label: string;
  value: string;
  hint?: string;
};

/** Chiffre clé : grand nombre tabulaire, libellé discret. */
export function Stat({
  label,
  value,
  hint,
}: StatProps): React.ReactElement {
  return (
    <div className="border-t border-foreground pt-4">
      <p className="num text-[clamp(28px,3vw,36px)] font-medium leading-none tracking-[-0.02em]">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
