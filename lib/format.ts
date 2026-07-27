const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Formate une date ISO YYYY-MM-DD en français long. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return dateFmt.format(d);
}

/** Formate une date en JJ/MM/AAAA. */
export function formatDateShort(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return shortDateFmt.format(d);
}

/** Libellé du sort d'un scrutin. */
export function formatSort(sortCode: string): string {
  const map: Record<string, string> = {
    adopte: "Adopté",
    rejecte: "Rejeté",
    rejete: "Rejeté",
  };
  return map[sortCode.toLowerCase()] ?? sortCode;
}

/** Libellé de position de vote. */
export function formatPosition(position: string): string {
  const map: Record<string, string> = {
    pour: "Pour",
    contre: "Contre",
    abstention: "Abstention",
    nonVotant: "Non-votant",
  };
  return map[position] ?? position;
}

export function formatPercent(
  part: number,
  total: number,
  digits = 0,
): string {
  if (total <= 0) return "—";
  return `${((100 * part) / total).toFixed(digits)} %`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("fr-FR");
}

export function nomComplet(
  prenom: string,
  nom: string,
  civilite?: string | null,
): string {
  const base = `${prenom} ${nom}`;
  return civilite ? `${civilite} ${base}` : base;
}

/** Première lettre en majuscule (titres open data souvent en minuscules). */
export function capitalizeTitre(text: string | null | undefined): string {
  if (!text?.trim()) return "";
  const t = text.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
