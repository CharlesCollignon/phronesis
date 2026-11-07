import Link from "next/link";

import { AvatarParlementaire } from "@/components/avatar-parlementaire";
import { GroupeCouleur, couleurDe } from "@/components/groupe-couleur";
import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { EluFiltres } from "@/components/elu-filtres";
import { FilterTabs } from "@/components/filter-tabs";
import { formatNumber } from "@/lib/format";
import type { DeputeListItem } from "@/lib/queries";
import { urlPhotoDepute, urlPhotoSenateur } from "@/lib/urls";

type EluListeProps = {
  chambre: "AN" | "SENAT";
  rows: DeputeListItem[];
  q: string;
  groupe: string;
  groupes: { uid: string; label: string }[];
  totalDeputes: number;
  totalSenateurs: number;
};

/** « 5 » → « 5e circ. », « 1 » → « 1re circ. ». */
export function libelleCirco(
  departement: string | null,
  num: string | null,
  long = false,
): string | null {
  if (!departement) return null;
  if (!num) return departement;
  const n = num.replace(/^0+/, "") || num;
  const suffix = n === "1" ? "re" : "e";
  return `${departement}, ${n}${suffix} ${long ? "circonscription" : "circ."}`;
}

/** Liste commune députés / sénateurs : bascule de chambre, filtres, grille. */
export function EluListe({
  chambre,
  rows,
  q,
  groupe,
  groupes,
  totalDeputes,
  totalSenateurs,
}: EluListeProps): React.ReactElement {
  const isAN = chambre === "AN";
  const base = isAN ? "/deputes" : "/senateurs";
  const filtered = q !== "" || groupe !== "";
  const noun = isAN ? "député" : "sénateur";

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Élus" },
      ]}
    >
      <PageHeader
        title="Élus"
        description={
          <>
            Les {formatNumber(totalDeputes)} députés et{" "}
            {formatNumber(totalSenateurs)} sénateurs en exercice, avec leur
            groupe, leur circonscription et l&apos;ensemble de leurs votes
            publics.
          </>
        }
      />

      <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
        <FilterTabs
          variant="segmented"
          label="Chambre"
          activeId={chambre}
          tabs={[
            {
              id: "AN",
              label: (
                <>
                  Députés{" "}
                  <span className="num ml-1.5 opacity-70">
                    {formatNumber(totalDeputes)}
                  </span>
                </>
              ),
              href: "/deputes",
            },
            {
              id: "SENAT",
              label: (
                <>
                  Sénateurs{" "}
                  <span className="num ml-1.5 opacity-70">
                    {formatNumber(totalSenateurs)}
                  </span>
                </>
              ),
              href: "/senateurs",
            },
          ]}
        />
        <EluFiltres
          action={base}
          q={q}
          groupe={groupe}
          groupes={groupes}
          placeholder={isAN ? "Nom d'un député…" : "Nom d'un sénateur…"}
        />
      </div>

      <div className="mb-3 mt-7 flex flex-wrap items-baseline justify-between gap-3 text-sm text-muted-foreground">
        <p className="num">
          {filtered
            ? `${formatNumber(rows.length)} résultat${rows.length > 1 ? "s" : ""}`
            : `${formatNumber(rows.length)} ${noun}s`}{" "}
          · ordre alphabétique
          {isAN ? (
            <>
              {" "}
              · 17<sup>e</sup> législature
            </>
          ) : (
            " · données AMO Assemblée / open data Sénat"
          )}
        </p>
        {filtered ? (
          <Link href={base} className="ln text-foreground">
            Effacer les filtres
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-border pt-6 text-[15px]">
          Aucun {noun} ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] border-l border-t border-border">
          {rows.map((d) => {
            const lieu = isAN
              ? libelleCirco(d.circoDepartement, d.circoNum)
              : d.circoDepartement;
            return (
              <li key={d.uid} className="flex">
                <Link
                  href={`${base}/${d.uid}`}
                  className="flex w-full items-center gap-3.5 border-b border-r border-border px-4 py-[18px] shadow-[inset_0_0_0_0_var(--accent)] transition-[background-color,box-shadow] duration-500 ease-[var(--spring)] hover:bg-[var(--highlight)] hover:shadow-[inset_0_3px_0_0_var(--accent)]"
                >
                  <AvatarParlementaire
                    src={
                      isAN
                        ? urlPhotoDepute(d.uid)
                        : urlPhotoSenateur(d.senatMatricule, d.prenom, d.nom)
                    }
                    prenom={d.prenom}
                    nom={d.nom}
                    size={44}
                    couleur={
                      d.groupeAbrege || d.groupeCouleur
                        ? couleurDe(d.groupeAbrege, d.groupeCouleur)
                        : null
                    }
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[17px] font-medium">
                      {d.prenom} {d.nom}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {d.groupeAbrege || d.groupeCouleur ? (
                        <GroupeCouleur
                          abrege={d.groupeAbrege}
                          couleur={d.groupeCouleur}
                          size={9}
                          className="mr-1.5"
                        />
                      ) : null}
                      <strong className="font-semibold text-foreground">
                        {d.groupeAbrege ?? d.groupeLibelle ?? "Sans groupe"}
                      </strong>
                      {lieu ? ` · ${lieu}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
