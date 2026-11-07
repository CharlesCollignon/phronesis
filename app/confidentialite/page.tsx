import Link from "next/link";

import { PageHeader, PageShell } from "@/components/breadcrumbs";

export const metadata = {
  title: "Politique de confidentialité",
};

const CONTACT = "collignoncharles@gmail.com";

const P = "mt-3.5 text-[17px] leading-[1.7]";
const UL = "mt-3.5 list-disc space-y-2 pl-5 text-[17px] leading-[1.7]";

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

function Mail(): React.ReactElement {
  return (
    <a href={`mailto:${CONTACT}`} className="ln">
      {CONTACT}
    </a>
  );
}

export default function ConfidentialitePage(): React.ReactElement {
  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Confidentialité" },
      ]}
    >
      <PageHeader
        title="Politique de confidentialité"
        description="Quelles données Phronesis traite, pourquoi, combien de temps, et comment exercer vos droits (RGPD)."
      />

      <div className="mt-12 max-w-3xl">
        <Bloc titre="Responsable du traitement">
          <p className={P}>
            Charles Collignon, éditeur de Phronesis. Contact pour toute
            question ou demande : <Mail />.
          </p>
        </Bloc>

        <Bloc titre="Sans compte">
          <p className={P}>
            La consultation du site ne demande aucun compte. Vos réponses à
            la Boussole ne sont pas conservées. La mesure d&apos;audience
            (Vercel Web Analytics) compte les pages vues de façon agrégée,
            sans cookie publicitaire.
          </p>
        </Bloc>

        <Bloc titre="Avec un compte">
          <ul className={UL}>
            <li>
              <strong>Compte</strong> : identifiant, adresse e-mail et nom
              transmis par le service de connexion choisi, via Clerk. Finalité
              : vous authentifier. Base légale : l&apos;exécution du service
              que vous demandez. Des cookies strictement nécessaires à la
              connexion sont déposés.
            </li>
            <li>
              <strong>Boussole</strong> : vos réponses peuvent révéler des
              opinions politiques, données dites sensibles. Elles restent sur
              votre appareil et ne sont enregistrées sur votre compte
              qu&apos;avec votre consentement explicite, demandé dans la
              Boussole. Vous pouvez retirer cet accord à tout moment avec le
              lien « Effacer mes réponses de mon compte » : vos réponses sont
              alors supprimées du compte.
            </li>
            <li>
              <strong>Consultations citoyennes</strong> : votre avis sur un
              dossier ou un scrutin est enregistré avec votre compte, ce qui
              peut révéler une opinion politique. Vous le donnez en cliquant,
              après avoir été informé ; seuls les totaux sont publiés, et
              vous pouvez retirer votre avis en cliquant à nouveau sur votre
              choix.
            </li>
            <li>
              <strong>Préférences et notifications</strong> : thème
              d&apos;affichage, date de dernière visite et série de jours,
              notifications affichées sur le site. Base légale : le
              fonctionnement du service.
            </li>
          </ul>
          <p className={P}>
            Ces données ne sont ni vendues, ni partagées, ni utilisées à des
            fins publicitaires. Elles sont conservées tant que votre compte
            existe, sauf retrait de votre part. Pour supprimer l&apos;ensemble
            de vos données, supprimez votre compte depuis le menu du compte
            (« Manage account », puis « Delete account ») : votre profil,
            votre Boussole, vos notifications et vos avis aux consultations
            sont alors effacés automatiquement. Vous pouvez aussi écrire à{" "}
            <Mail /> : la suppression est faite dans un délai d&apos;un mois.
          </p>
        </Bloc>

        <Bloc titre="Données publiques sur les élus">
          <p className={P}>
            Phronesis réutilise les données publiées par l&apos;Assemblée
            nationale, le Sénat et la Haute Autorité pour la transparence de
            la vie publique sur les parlementaires (mandats, votes,
            amendements, liens vers leurs déclarations), dans le but
            d&apos;informer sur leur activité publique. Base légale :
            l&apos;intérêt légitime d&apos;information du public. Un élu peut
            demander la correction d&apos;une erreur ou exercer son droit
            d&apos;opposition en écrivant à <Mail />.
          </p>
        </Bloc>

        <Bloc titre="Prestataires">
          <ul className={UL}>
            <li>Vercel : hébergement du site et mesure d&apos;audience.</li>
            <li>Neon : base de données, serveurs situés à Londres.</li>
            <li>Clerk : gestion des comptes et de la connexion.</li>
            <li>
              Mistral AI : génération des résumés, empreintes et classements,
              à partir des seuls documents publics. Aucune donnée
              d&apos;utilisateur ne lui est transmise.
            </li>
          </ul>
          <p className={P}>
            Certains de ces prestataires peuvent traiter des données hors de
            l&apos;Union européenne, dans le cadre des garanties prévues par
            le RGPD.
          </p>
        </Bloc>

        <Bloc titre="Vos droits">
          <p className={P}>
            Vous disposez d&apos;un droit d&apos;accès, de rectification,
            d&apos;effacement, de limitation, de portabilité et
            d&apos;opposition, ainsi que du droit de retirer votre
            consentement à tout moment. Écrivez à <Mail />. Vous pouvez aussi
            adresser une réclamation à la CNIL (cnil.fr).
          </p>
          <p className={P}>
            Voir aussi les{" "}
            <Link href="/mentions-legales" className="ln">
              mentions légales
            </Link>
            .
          </p>
        </Bloc>
      </div>
    </PageShell>
  );
}
