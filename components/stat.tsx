import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatProps = {
  label: string;
  value: string;
  hint?: string;
};

export function Stat({
  label,
  value,
  hint,
}: StatProps): React.ReactElement {
  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader className="gap-0 p-4 pb-0">
        <CardDescription className="text-xs uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle className="num mt-1 text-2xl font-normal">
          {value}
        </CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="p-4 pt-1">
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
