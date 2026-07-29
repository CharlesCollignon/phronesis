# Phronesis

Plateforme d'éducation civique — **comprendre avant de juger**.

Phronesis (du grec *phrónēsis*, sagesse pratique) aide à former un
jugement informé sur les lois, les votes et les scrutins publics,
sans orienter politiquement l'utilisateur. L'application croise des
données open data (Assemblée nationale, Sénat) avec une méthode
propre : carte de valeurs personnelle, empreinte qualitative des
textes, et mesure d'alignement — jamais un score moral.

MVP (17<sup>e</sup> législature) : dossiers législatifs, scrutins
publics nominatifs, fiches députés / sénateurs, groupes, comparateur,
Score Phronesis, empreinte civique, Boussole, résonance, recherche
plein texte, résumés IA affichés à côté de la version officielle.

## Méthode Phronesis

### Boussole

Quiz de valeurs en dilemmes contextualisés (pas « gauche / droite »).
Chaque réponse alimente une carte sur une dizaine d'axes (liberté,
égalité, solidarité, responsabilité, autorité, vie privée, écologie,
intervention de l'État, marché, décentralisation). Le profil peut
être stocké en local et synchronisé sur un compte Clerk.

La Boussole sert ensuite à **comparer** votre carte à des
conceptions philosophiques documentées, et à projeter un
**alignement** avec les textes législatifs (voir Résonance).

### Empreinte civique

Pour chaque dossier, Phronesis décrit des **impacts qualitatifs**
par axe (renforce / restreint / mitige / non abordé / indéterminé),
avec justifications et sources. Aucune note numérique par axe, aucun
conseil de vote. Les empreintes sont générées hors ligne (batch IA)
puis lues par l'app en production.

### Résonance

Similarité (cosinus) entre votre profil Boussole et la projection
de l'empreinte d'un dossier sur les axes mappables. Ce n'est **pas**
le Score Phronesis, ni un jugement « bon / mauvais » : c'est un
indicateur d'alignement avec **votre** méthode de valeurs.

### Score Phronesis

Indicateur de **robustesse documentaire** d'un dossier (complétude
des sources, présence d'empreinte, etc.) — distinct de l'empreinte
qualitative et de la résonance.

### Comparateur et groupes

Comparer les positions de vote entre députés / sénateurs, et
explorer l'empreinte agrégée des groupes parlementaires à partir
des dossiers liés aux scrutins où le groupe s'est exprimé.

Limite essentielle : seuls les **scrutins publics nominatifs** sont
disponibles en open data. Voir `/methodologie` dans l'application.

## Prérequis

- Node.js 20+
- pnpm
- Docker

## Démarrage

```bash
# Base de données
docker compose up -d
cp .env.example .env

# Dépendances & schéma
pnpm install
pnpm db:migrate

# Ingestion open data Assemblée nationale
pnpm ingest

# Application
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Scripts utiles

| Commande | Rôle |
| --- | --- |
| `pnpm ingest` | Ingestion complète (acteurs → dossiers → scrutins → amendements) |
| `pnpm ingest:acteurs` | Acteurs, organes, mandats |
| `pnpm ingest:dossiers` | Dossiers, actes, documents |
| `pnpm ingest:scrutins` | Scrutins et votes nominatifs |
| `pnpm ingest:amendements` | Amendements |
| `pnpm ingest:senat` | Matricules ODSEN + scrutins/votes Dosleg |
| `pnpm resumes:generate -- --limit=10` | Batch de résumés IA |
| `pnpm empreintes:generate -- --limit=5` | Batch d'empreintes qualitatives |
| `pnpm db:prune-soft` | Nettoyage soft stockage (orphelins, colonnes sparses) |
| `pnpm db:studio` | Drizzle Studio |

Pour les résumés / empreintes IA, renseigner `MISTRAL_API_KEY` ou
`OPENAI_API_KEY` dans `.env` (`AI_PROVIDER=mistral|openai`).

Après `db:prune-soft`, lancer `VACUUM ANALYZE` sur Neon (SQL Editor
ou `psql` URL directe) pour libérer l'espace mort.

## Sources

Données : [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr/)
et [data.senat.fr](https://data.senat.fr/) (licences ouvertes).
Détail des calculs : `/methodologie`.

## Déploiement (production)

Stack : **GitHub** (code) + **Vercel** (Next.js) + **Neon**
(Postgres) + **Clerk** (auth).

### Prérequis prod

- Compte [Vercel](https://vercel.com) lié au dépôt GitHub
- Base [Neon Postgres](https://neon.tech) (région Europe recommandée)
- Application [Clerk](https://dashboard.clerk.com)

Variables : voir [`.env.example`](.env.example). Sur Vercel :
`DATABASE_URL` (URL **pooler** Neon), clés Clerk et URLs
`NEXT_PUBLIC_CLERK_*`.

Les clés IA ne sont **pas** requises sur Vercel — batchs locaux
uniquement.

### Initialiser la base prod

```bash
docker exec phronesis-db pg_dump -U phronesis -d phronesis \
  --no-owner --no-acl -F c -f /tmp/phronesis.dump
docker cp phronesis-db:/tmp/phronesis.dump ./phronesis.dump

pg_restore --dbname="$NEON_DIRECT_URL" \
  --no-owner --no-acl --clean --if-exists phronesis.dump
```

### Mises à jour de données (hors Vercel)

Dans `.env`, `DATABASE_URL` = URL Neon **directe** (entre guillemets).

```bash
unset DATABASE_URL   # si un export Docker traîne dans le shell
pnpm empreintes:generate -- --limit=50

# boucle jusqu'à épuisement :
LOOP=1 LIMIT=50 ./scripts/deploy/setup-production.sh empreintes
```

L'app Vercel lit la base à la volée — pas de redéploiement après
ingestion ou génération d'empreintes.
