# Déploiement production

**URL production :** https://phronesis-seven-neon.vercel.app  
**GitHub :** https://github.com/CharlesCollignon/phronesis  
**Vercel :** projet `phronesis` (`prj_772r6unhHd4dcHuhNAmvLf6WiUxN`)

Le setup initial est terminé. Chaque push sur `main` déclenche un
déploiement Vercel automatique.

## Maintenance des données (hors Vercel)

```bash
export DATABASE_URL="<NEON_URL_DIRECTE>"
pnpm ingest
pnpm empreintes:generate -- --limit=50
```

Utiliser l’URL **directe** Neon (sans `-pooler`) pour les scripts
batch. Sur Vercel, `DATABASE_URL` doit rester l’URL **pooler**.

## Script utilitaire

```bash
./scripts/deploy/setup-production.sh vercel-env   # sync .env → Vercel
./scripts/deploy/setup-production.sh vercel-deploy
```
