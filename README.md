# Phronesis

Plateforme d'éducation civique — **comprendre avant de juger**.

MVP (17<sup>e</sup> législature) : dossiers législatifs, scrutins publics
nominatifs, fiches députés, comparateur, Score Phronesis, empreinte
civique qualitative, recherche plein texte, résumés IA toujours
affichés à côté de la version officielle.

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
| `pnpm db:studio` | Drizzle Studio |

Pour les résumés IA, renseigner `MISTRAL_API_KEY` ou `OPENAI_API_KEY`
dans `.env` (`AI_PROVIDER=mistral|openai`).

## Sources

Données : [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr/)
(licence ouverte). Voir `/methodologie` dans l'application.

## Déploiement (production)

Stack cible : **GitHub** (code) + **Vercel** (Next.js) + **Neon**
(Postgres) + **Clerk** (auth).

### Prérequis prod

- Compte [Vercel](https://vercel.com) lié au dépôt GitHub
- Base [Neon Postgres](https://neon.tech) (région Europe recommandée)
- Application [Clerk](https://dashboard.clerk.com) avec clés prod ou test

Variables d'environnement : voir [`.env.example`](.env.example).
Sur Vercel, renseigner au minimum `DATABASE_URL` (URL **pooler**
Neon), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` et
les URLs Clerk (`NEXT_PUBLIC_CLERK_*`).

Les clés `MISTRAL_API_KEY` / `OPENAI_API_KEY` ne sont **pas**
requises sur Vercel — réservées aux scripts batch locaux.

### Initialiser la base prod

```bash
# Export local (Docker)
docker exec phronesis-db pg_dump -U phronesis -d phronesis \
  --no-owner --no-acl -F c -f /tmp/phronesis.dump
docker cp phronesis-db:/tmp/phronesis.dump ./phronesis.dump

# Restore sur Neon (URL directe, pas pooler)
pg_restore --dbname="$NEON_DIRECT_URL" \
  --no-owner --no-acl --clean --if-exists phronesis.dump
```

### Mises à jour de données (hors Vercel)

Les scripts `pnpm ingest`, `pnpm empreintes:generate` et
`pnpm resumes:generate` s'exécutent depuis votre machine.
Dans `.env`, mettre `DATABASE_URL` sur l'URL Neon **directe**
(entre guillemets). Avant de lancer un batch :

```bash
unset DATABASE_URL   # si un export Docker traîne dans le shell
pnpm empreintes:generate -- --limit=50

# boucle jusqu'à épuisement :
LOOP=1 LIMIT=50 ./scripts/deploy/setup-production.sh empreintes
```

L'application Vercel lit la base à la volée — pas de redéploiement
nécessaire après ingestion.
