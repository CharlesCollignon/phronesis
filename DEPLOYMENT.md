# Déploiement production

**URL production :** https://www.phronesis-france.com  
**GitHub :** https://github.com/CharlesCollignon/phronesis  
**Vercel :** projet `phronesis` (`prj_772r6unhHd4dcHuhNAmvLf6WiUxN`)

Le setup initial est terminé. Chaque push sur `main` déclenche un
déploiement Vercel automatique.

## Maintenance des données (hors Vercel)

En production, l’ingestion open data tourne **chaque lundi** via
GitHub Actions (`.github/workflows/ingest-weekly.yml`). Relance
manuelle : onglet Actions → *Ingest open data (weekly)* →
*Run workflow*.

Secret GitHub : `DATABASE_URL` = URL Neon **directe** (sans `-pooler`).

Les résumés IA des dossiers sont générés automatiquement à partir des
textes officiels : chaque lundi après l'ingestion (2 h maximum), puis le
1er du mois (*IA mensuelle*), avant le classement des amendements qui
utilise le budget Mistral restant.

## Cache des pages et coût Neon

Neon s'endort après 5 minutes sans requête et se facture au temps
d'éveil : chaque lecture hors cache isolée coûte 5 minutes de calcul.
Les pages lisent donc la base à travers un cache (`lib/cache.ts`), qui
survit aux déploiements, et deux règles le gardent rempli :

- **on n'invalide que ce qui a changé.** Chaque batch (ingestion,
  résumés, empreintes) note dans la table `invalidations_cache` les
  dossiers et scrutins dont il a réellement modifié les données. Les
  autres fiches restent en cache sans limite de durée ;
- **ce qui est invalidé est relu aussitôt.** `pnpm cache:rafraichir`
  envoie ces étiquettes au site (`POST /api/revalidate`), invalide les
  listes, élus et groupes, puis relit toutes ces pages d'un trait,
  pendant que Neon est encore éveillé.

Les workflows lancent `pnpm cache:rafraichir` à la fin de chaque batch.
Après un batch en local (résumés, empreintes, ingestion), le lancer à
la main ; `.env` doit contenir `DATABASE_URL` et `REVALIDATE_SECRET` :

```bash
pnpm cache:rafraichir
```

Pour tout relire (toutes les fiches, une heure environ) : workflow
*Cache du site (rafraîchir)* en cochant « tout », ou
`pnpm cache:rafraichir --tout`. À faire :

- après avoir incrémenté `CACHE_VERSION` dans `lib/cache.ts` (format
  renvoyé par une requête en cache modifié) : toutes les entrées sont
  alors vides ;
- après un changement de logique d'ingestion qui modifie des données
  affichées sans passer par les écritures habituelles.

Une lecture ajoutée à une fiche dossier ou scrutin doit être couverte
par ces invalidations : si un batch modifie ce qu'elle affiche, il doit
le noter (`scripts/lib/invalidations.ts`).

Secrets :

```bash
gh secret set DATABASE_URL        # URL Neon directe
gh secret set REVALIDATE_SECRET   # même valeur que sur Vercel
```

Côté Vercel, `REVALIDATE_SECRET` doit être défini en Production.

En local, vers Neon :

```bash
export DATABASE_URL="<NEON_URL_DIRECTE>"
pnpm ingest -- --force
pnpm empreintes:generate -- --limit=50
```

Utiliser l’URL **directe** Neon (sans `-pooler`) pour les scripts
batch. Sur Vercel, `DATABASE_URL` doit rester l’URL **pooler**.

## Pages statiques et coût Vercel

L'offre gratuite de Vercel compte le temps de calcul des fonctions
(« Fluid Active CPU », 4 h par mois pour tout le compte) et met tous
les projets en pause au-delà. Tant que chaque page était rendue à
chaque requête, un robot qui parcourait les quelque 19 500 fiches
coûtait un rendu par passage (de l'ordre de 100 ms de calcul par
fiche, mesuré en local).

- **Les fiches sont statiques** (dossier, scrutin, député, sénateur,
  groupe) : générées à la première visite, puis servies depuis le
  cache sans exécuter de fonction. Elles héritent des étiquettes de
  leurs lectures (`lib/cache.ts`) : `pnpm cache:rafraichir` les
  régénère donc en les relisant, comme avant. Une page ne doit lire ni
  `searchParams`, ni cookies, ni en-têtes, sinon elle redevient
  dynamique : `pnpm build` l'affiche alors en `ƒ` au lieu de `●`.
- **Les filtres d'un scrutin s'appliquent dans le navigateur**
  (`components/vote-list-filter.tsx`) : la page contient toutes les
  positions, quelle que soit l'URL.
- **Un avis de consultation n'invalide que sa fiche**
  (`tagSondageDossier`, `tagSondageScrutin` dans `lib/sondages.ts`).
- **Le middleware Clerk ne s'exécute que sur les routes qui appellent
  `auth()`** (`middleware.ts`). Une nouvelle route qui lit la session
  doit être ajoutée à son `matcher`.
- **Les liens de l'en-tête, du pied de page et des longues listes ne
  sont pas préchargés** (`prefetch={false}`) : chaque lien en vue
  déclenchait une requête, jusqu'à plusieurs centaines pour une liste
  nominative, et `robots.txt` écarte les URL `_rsc` du routeur.

Restent rendues à chaque requête : l'accueil, les listes (pagination et
filtres dans l'URL), la recherche, le comparateur et les plans du site.

Un déploiement repart avec un cache de pages vide (le cache des
lectures, lui, survit) : chaque fiche est régénérée à sa première
visite, sans relire la base. Après un déploiement, vérifier sur une
fiche que l'en-tête `x-vercel-cache` passe de `MISS` à `HIT` au second
appel.

## Script utilitaire

```bash
./scripts/deploy/setup-production.sh vercel-env   # sync .env → Vercel
./scripts/deploy/setup-production.sh vercel-deploy
```
