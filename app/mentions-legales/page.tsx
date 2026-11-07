import Link from "next/link";

import { PageHeader, PageShell } from "@/components/breadcrumbs";

export const metadata = {
  title: "Mentions légales",
};

const CONTACT = "collignoncharles@gmail.com";

const P = "mt-3.5 text-[17px] leading-[1.7]";
const UL = "mt-3.5 list-disc space-y-1.5 pl-5 text-[17px] leading-[1.7]";

function Bloc({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="border-t border-border py-8">
      <h2 className="text-2xl font-semibold leading-tight tracking-[-0.01em]">
        {titre}
      </h2>
      {children}
    </section>
  );
}

export default function MentionsLegalesPage(): React.ReactElement {
  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Mentions légales" },
      ]}
    >
      <PageHeader
        title="Mentions légales"
        description="Informations prévues par la loi pour la confiance dans l'économie numérique (LCEN, art. 6)."
      />

      <div className="mt-12 max-w-3xl">
        <Bloc titre="Éditeur">
          <p className={P}>
            Phronesis est un site édité à titre non professionnel par
            Charles Collignon, qui en est le directeur de la publication.
            Ses coordonnées complètes ont été communiquées à
            l&apos;hébergeur.
          </p>
          <p className={P}>
            Contact :{" "}
            <a href={`mailto:${CONTACT}`} className="ln">
              {CONTACT}
            </a>
          </p>
        </Bloc>

        <Bloc titre="Hébergement">
          <ul className={UL}>
            <li>
              Site : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA
              91723, États-Unis — vercel.com
            </li>
            <li>
              Base de données : Neon (neon.com), serveurs situés à Londres
              (AWS eu-west-2)
            </li>
          </ul>
        </Bloc>

        <Bloc titre="Indépendance et contenus">
          <p className={P}>
            Phronesis est indépendant de tout parti, élu ou institution. Les
            informations sur les dossiers législatifs, les scrutins et les
            élus proviennent des données ouvertes de l&apos;Assemblée
            nationale, du Sénat et de la Haute Autorité pour la transparence
            de la vie publique, réutilisées sous Licence Ouverte. Les sources
            et la date de dernière mise à jour sont indiquées sur le site.
          </p>
          <p className={P}>
            Certains contenus sont générés par intelligence artificielle
            (résumés, empreintes civiques, classement des amendements) : ils
            sont signalés comme tels, indiquent le modèle utilisé et restent
            affichés à côté des sources officielles. La méthode est décrite
            dans la{" "}
            <Link href="/methodologie" className="ln">
              méthodologie
            </Link>
            .
          </p>
        </Bloc>

        <Bloc titre="Signaler une erreur, droit de réponse">
          <p className={P}>
            Toute personne nommée sur le site peut exercer un droit de
            réponse, et chacun peut signaler une erreur (donnée, classement
            ou contenu généré par IA) en écrivant à{" "}
            <a href={`mailto:${CONTACT}`} className="ln">
              {CONTACT}
            </a>
            , en précisant la page concernée. Les corrections sont faites
            dans les meilleurs délais.
          </p>
        </Bloc>

        <Bloc titre="Données personnelles">
          <p className={P}>
            Voir la{" "}
            <Link href="/confidentialite" className="ln">
              politique de confidentialité
            </Link>
            .
          </p>
        </Bloc>
      </div>
    </PageShell>
  );
}
