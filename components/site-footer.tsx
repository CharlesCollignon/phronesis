import Link from "next/link";

/** Pied de page noir : identité, liens de méthode, sources. */
export function SiteFooter(): React.ReactElement {
  return (
    <footer className="mt-auto bg-[#0a0a0a] text-white">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-6 px-5 pb-7 pt-10 sm:px-8 lg:px-12">
        <div>
          <p className="font-[family-name:var(--font-logo)] text-[26px] uppercase tracking-[0.03em] text-[var(--logo)]">
            Phronesis
          </p>
          <p className="mt-2 text-sm text-[#a3a3a3]">
            Plateforme indépendante. Affiliée à aucun parti ni aucune
            institution.
          </p>
        </div>
        <nav
          aria-label="Pied de page"
          className="flex flex-wrap gap-6 text-sm text-[#d4d4d4]"
        >
          <Link href="/methodologie" className="hover:text-white">
            Méthodologie
          </Link>
          <Link href="/philosophies" className="hover:text-white">
            Philosophies
          </Link>
          <Link href="/recherche" className="hover:text-white">
            Recherche
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-[1240px] px-5 pb-6 text-[13px] text-[#8a8a8a] sm:px-8 lg:px-12">
        Données :{" "}
        <a
          href="https://data.assemblee-nationale.fr/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white"
        >
          data.assemblee-nationale.fr
        </a>
        ,{" "}
        <a
          href="https://data.senat.fr/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white"
        >
          data.senat.fr
        </a>
        , sous Licence Ouverte.
      </div>
    </footer>
  );
}
