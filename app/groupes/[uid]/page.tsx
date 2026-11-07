import Link from "next/link";
import { notFound } from "next/navigation";

import { AvatarParlementaire } from "@/components/avatar-parlementaire";
import {
  PageHeader,
  PageShell,
  SectionHeading,
} from "@/components/breadcrumbs";
import { libelleCirco } from "@/components/elu-liste";
import { GroupeCohesion } from "@/components/groupe-cohesion";
import { GroupeSigle, couleurDe } from "@/components/groupe-couleur";
import { Hemicycle } from "@/components/hemicycle";
import { AxesBars, RadarProfil } from "@/components/profil-axes";
import { ResonancePanel } from "@/components/resonance-panel";
import { Stat } from "@/components/stat";
import { getEmpreinteGroupe } from "@/lib/empreinte-groupe";
import { formatNumber } from "@/lib/format";
import {
  getGroupePositionsRecentes,
  listDeputes,
  listGroupesEffectifs,
  listSenateurs,
} from "@/lib/queries";
import { urlPhotoDepute, urlPhotoSenateur } from "@/lib/urls";

export const dynamic = "force-dynamic";

const SIEGES = { AN: 577, SENAT: 348 } as const;

type PageProps = {
  params: Promise<{ uid: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<{ title: string }> {
  const { uid } = await params;
  const data = await getEmpreinteGroupe(uid);
  return {
    title: data
      ? `${data.groupe.libelle} — Groupe`
      : "Groupe parlementaire",
  };
}

export default async function GroupePage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const data = await getEmpreinteGroupe(uid);
  if (!data) notFound();

  const { groupe, profil, axesUtilises } = data;
  const chambre: "AN" | "SENAT" =
    groupe.codeType === "GROUPESENAT" ? "SENAT" : "AN";
  const isAN = chambre === "AN";
  const compareType = isAN ? "groupes" : "groupes_senat";
  const [effectifs, parlementaires, positionsRecentes] = await Promise.all([
    listGroupesEffectifs(chambre),
    isAN ? listDeputes("") : listSenateurs(""),
    getGroupePositionsRecentes(groupe.uid),
  ]);
  const membres = parlementaires.filter((p) => p.groupeUid === groupe.uid);
  const effectif =
    effectifs.find((e) => e.uid === groupe.uid)?.effectif ?? membres.length;
  const partSieges = (100 * effectif) / SIEGES[chambre];
  const base = isAN ? "/deputes" : "/senateurs";

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        {
          label: "Groupes",
          href: isAN ? "/groupes" : "/groupes?chambre=SENAT",
        },
        { label: groupe.libelleAbrege ?? groupe.libelle },
      ]}
    >
      <PageHeader
        eyebrow={`Groupe parlementaire · ${isAN ? "Assemblée nationale" : "Sénat"}`}
        title={groupe.libelle}
        size={groupe.libelle.length > 48 ? "long" : "default"}
        aside={
          <dl className="flex flex-wrap gap-x-9 gap-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">Sigle</dt>
              <dd className="mt-1 text-[28px] font-medium leading-tight">
                <GroupeSigle
                  abrege={groupe.libelleAbrege}
                  couleur={groupe.couleur}
                  size={18}
                  className="gap-2.5"
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Membres</dt>
              <dd className="num mt-1 text-[28px] font-medium leading-tight">
                {formatNumber(effectif)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Sièges</dt>
              <dd className="num mt-1 text-[28px] font-medium leading-tight">
                {partSieges.toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })}{" "}
                %
              </dd>
            </div>
          </dl>
        }
      />

      <div
        className="rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
        style={{ animationDelay: "200ms" }}
      >
        <Link
          href={`/comparateur?type=${compareType}&a=${groupe.uid}`}
          className="btn btn-accent"
        >
          Comparer ce groupe
        </Link>
        <Link href="#membres" className="ln text-[15px] font-medium">
          Voir les membres
        </Link>
        <Link
          href="/methodologie"
          className="ln text-[15px] font-medium"
        >
          Méthode d&apos;agrégation
        </Link>
      </div>

      <div className="flex flex-wrap items-start gap-x-14 gap-y-16 pt-16">
        <div className="min-w-0 flex-[2_1_600px]">
          <section>
            <SectionHeading title="Empreinte agrégée" rule />
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#404040] dark:text-muted-foreground">
              Vecteur construit à partir des majorités pour/contre du
              groupe sur des scrutins publics liés à des dossiers avec
              empreinte. Ce n&apos;est pas un score moral, ni le Score
              Phronesis. Majorité ≠ unanimité ; votes à main levée exclus.
            </p>
            <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6">
              <Stat
                label="Scrutins mobilisés"
                value={formatNumber(data.scrutinsMobilises)}
              />
              <Stat
                label="Dossiers mobilisés"
                value={formatNumber(data.dossiersMobilises)}
              />
              <Stat
                label="Axes renseignés"
                value={formatNumber(axesUtilises.length)}
              />
            </div>

            {data.scrutinsMobilises === 0 ? (
              <p className="mt-8 border-t border-border pt-5 text-[15px] text-muted-foreground">
                Pas assez de scrutins publics liés à des dossiers avec
                empreinte pour construire un vecteur.
              </p>
            ) : (
              <div className="mt-10 grid gap-10 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold">Profil</h3>
                  <div className="mt-4">
                    <RadarProfil
                      profil={profil}
                      ariaLabel={`Profil ${groupe.libelle}`}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Axes</h3>
                  <div className="mt-4">
                    <AxesBars
                      profil={profil}
                      axes={
                        axesUtilises.length > 0 ? axesUtilises : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {data.scrutinsMobilises > 0 ? (
            <section className="pt-16">
              <SectionHeading
                title="Proximité philosophique"
                rule
              />
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#404040] dark:text-muted-foreground">
                Similarité cosinus avec les six conceptions de référence —
                pas une affiliation partisane.
              </p>
              <div className="mt-6">
                <ul className="border-b border-border">
                  {data.rankingPhilosophies.map(({ philo, score }, i) => {
                    const pct = Math.round(
                      Math.max(0, Math.min(1, score)) * 100,
                    );
                    return (
                      <li key={philo.id}>
                        <Link
                          href={`/philosophies/${philo.id}`}
                          className="row-link grid grid-cols-[minmax(0,1fr)_56px] items-center gap-x-4 gap-y-2 border-t border-border px-2 py-4 md:grid-cols-[220px_minmax(0,1fr)_56px]"
                        >
                          <span className="text-base font-medium">
                            {philo.label}
                          </span>
                          <span className="col-span-2 row-start-2 block h-1.5 bg-[var(--vote-neutre)] md:col-span-1 md:col-start-2 md:row-start-1">
                            <span
                              className="grow-x block h-full bg-foreground"
                              style={{
                                width: `${pct}%`,
                                animationDelay: `${150 + i * 60}ms`,
                              }}
                            />
                          </span>
                          <span className="num col-start-2 row-start-1 text-right text-[15px] md:col-start-3">
                            {Math.round(score * 100)} %
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="min-w-0 flex-[1_1_300px] space-y-12">
          <section className="border-t border-foreground pt-5">
            <h2 className="eyebrow">Place dans l&apos;hémicycle</h2>
            <Hemicycle
              groups={effectifs}
              chambre={chambre}
              selectedUid={groupe.uid}
              compact
              className="mt-4"
            />
          </section>
          {data.scrutinsMobilises > 0 ? (
            <ResonancePanel
              rows={data.empreinteSynthetique}
              compareLabel="Projection groupe"
              title="Résonance avec votre boussole"
            />
          ) : null}
        </aside>
      </div>

      <GroupeCohesion rows={positionsRecentes} />

      <section id="membres" className="scroll-mt-24 pt-20">
        <SectionHeading
          title="Membres"
          aside={
            <Link
              href={`${base}?groupe=${groupe.uid}`}
              className="ln text-[15px] text-foreground"
            >
              Ouvrir dans la liste des élus
            </Link>
          }
        />
        {membres.length === 0 ? (
          <p className="border-t border-border pt-5 text-[15px] text-muted-foreground">
            Aucun membre en exercice référencé.
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] border-l border-t border-border">
            {membres.map((m) => {
              const lieu = isAN
                ? libelleCirco(m.circoDepartement, m.circoNum)
                : m.circoDepartement;
              return (
                <li key={m.uid} className="flex">
                  <Link
                    href={`${base}/${m.uid}`}
                    className="flex w-full items-center gap-3.5 border-b border-r border-border p-4 shadow-[inset_0_0_0_0_var(--accent)] transition-[background-color,box-shadow] duration-500 ease-[var(--spring)] hover:bg-[var(--highlight)] hover:shadow-[inset_0_3px_0_0_var(--accent)]"
                  >
                    <AvatarParlementaire
                      src={
                        isAN
                          ? urlPhotoDepute(m.uid)
                          : urlPhotoSenateur(
                              m.senatMatricule,
                              m.prenom,
                              m.nom,
                            )
                      }
                      prenom={m.prenom}
                      nom={m.nom}
                      size={40}
                      couleur={couleurDe(groupe.libelleAbrege, groupe.couleur)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium">
                        {m.prenom} {m.nom}
                      </span>
                      {lieu ? (
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {lieu}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
