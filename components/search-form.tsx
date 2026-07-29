import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchFormProps = {
  action?: string;
  placeholder?: string;
  defaultValue?: string;
  compact?: boolean;
};

export function SearchForm({
  action = "/recherche",
  placeholder = "Rechercher une loi, un vote, un député…",
  defaultValue = "",
  compact = false,
}: SearchFormProps): React.ReactElement {
  return (
    <form action={action} method="get" className="w-full">
      <label className="sr-only" htmlFor="q">
        Recherche
      </label>
      <div
        className={
          compact
            ? "flex gap-2"
            : "flex flex-col gap-2 sm:flex-row"
        }
      >
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-none shadow-none"
        />
        <Button type="submit" className="rounded-none shadow-sm">
          Rechercher
        </Button>
      </div>
    </form>
  );
}
