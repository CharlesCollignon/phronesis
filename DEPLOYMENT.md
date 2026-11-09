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

Les pages lisent la base à travers un cache (`lib/cache.ts`) qui dure
jusqu'à la prochaine ingestion, pour ne pas réveiller Neon à chaque
visite. Le cache survit aux déploiements. Le workflow le vide à la fin
de l'ingestion via `POST /api/revalidate`.

Après une génération de résumés ou d'empreintes en local, vider le
cache à la main :

```bash
curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" \
  https://www.phronesis-france.com/api/revalidate
```

Si un changement de code modifie le format renvoyé par une requête en
cache, incrémenter `CACHE_VERSION` dans `lib/cache.ts`.

Secrets :

```bash
gh secret set DATABASE_URL
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

## Script utilitaire

```bash
./scripts/deploy/setup-production.sh vercel-env   # sync .env → Vercel
./scripts/deploy/setup-production.sh vercel-deploy
```
