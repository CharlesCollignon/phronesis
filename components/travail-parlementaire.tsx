import { Stat } from "@/components/stat";
import { formatNumber } from "@/lib/format";
import type {
  IndicateursDepute,
  Mesure,
  NomMesure,
} from "@/lib/travail-parlementaire";

function pourcent(v: number | null): string {
  return v == null ? "—" : `${Math.round(v * 100)} %`;
}

function nombre(v: number | null): string {
  return v == null ? "—" : formatNumber(Math.round(v));
}

/** « médiane de l'Assemblée : 23 % · au-dessus de 64 % des députés » */
function comparaison(
  m: Mesure,
  format: (v: number | null) => string,
): string {
  const parts = [`Médiane de l'Assemblée : ${format(m.mediane)}`];
  if (m.rang != null) {
    parts.push(`au-dessus de ${Math.round(m.rang * 100)} % des députés`);
  }
  return parts.join(" · ");
}

/**
 * Indicateurs de travail parlementaire, chacun comparé à la médiane
 * de l'Assemblée. Pour un groupe, les valeurs sont la médiane de ses
 * membres.
 */
export function TravailParlementaire({
  mesures,
  brut,
}: {
  mesures: Record<NomMesure, Mesure>;
  /** Chiffres bruts d'un député (absent pour un groupe). */
  brut?: IndicateursDepute;
}): React.ReactElement {
  const details = (texte: string): string =>
    brut ? `${texte}. ` : "";
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Stat
        label="Participation à tous les scrutins publics"
        value={pourcent(mesures.participation.valeur)}
        hint={
          details(
            brut
              ? `${formatNumber(brut.scrutinsVotes)} sur ${formatNumber(brut.scrutinsTenus)} scrutins tenus pendant le mandat`
              : "",
          ) + comparaison(mesures.participation, pourcent)
        }
      />
      <Stat
        label="Amendements déposés"
        value={nombre(mesures.amendementsDeposes.valeur)}
        hint={comparaison(mesures.amendementsDeposes, nombre)}
      />
      <Stat
        label="Part des amendements adoptés"
        value={pourcent(mesures.tauxAdoption.valeur)}
        hint={
          details(
            brut ? `${formatNumber(brut.amendementsAdoptes)} adoptés` : "",
          ) + comparaison(mesures.tauxAdoption, pourcent)
        }
      />
      <Stat
        label="Amendements non défendus"
        value={pourcent(mesures.tauxNonSoutenus.valeur)}
        hint={
          details(
            brut
              ? `${formatNumber(brut.amendementsNonSoutenus)} sur ${formatNumber(brut.amendementsExamines)} examinés, auteur absent pour les soutenir`
              : "",
          ) + comparaison(mesures.tauxNonSoutenus, pourcent)
        }
      />
    </div>
  );
}
