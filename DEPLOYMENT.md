# Déploiement production — étapes restantes

L'application est déployée sur Vercel : **https://phronesis-seven-neon.vercel.app**

Le dépôt Git local est prêt (`main`, 2 commits). Il reste deux
actions **manuelles** (bloquées pour les agents IA / CLI non interactif).

## 1. GitHub — authentifier `gh` et pousser

```bash
export PATH="$HOME/.local/bin:$PATH"
gh auth login   # SSH, compte CharlesCollignon
./scripts/deploy/setup-production.sh github
```

Crée `github.com/CharlesCollignon/phronesis` (public) et pousse `main`.

Puis lier Git à Vercel :

```bash
vercel git connect git@github.com:CharlesCollignon/phronesis.git
```

## 2. Neon — accepter les terms et provisionner Postgres

1. Ouvrir et accepter :
   https://vercel.com/charles-collignons-projects/~/integrations/accept-terms/neon?source=cli

2. Créer la base :

```bash
cd /home/charles/Code/charles/phronesis
vercel integration add neon --name phronesis-db -e production -e preview
```

3. Copier dans `.env` :
   - `DATABASE_URL` → URL **pooler** (Vercel Production)
   - `NEON_DIRECT_URL` → URL **directe** (restore / migrations)

4. Restaurer les données locales :

```bash
export NEON_DIRECT_URL="<url directe neon>"
./scripts/deploy/setup-production.sh neon-restore
./scripts/deploy/setup-production.sh vercel-env
vercel deploy --prod --yes
```

Le dump local `phronesis.dump` (62 Mo) est déjà généré à la racine du
projet ; il sera recréé depuis Docker si absent.

## 3. Clerk — domaine Vercel (déjà partiellement configuré)

`allowed_origins` inclut `https://phronesis-seven-neon.vercel.app`
(instance **test** Clerk).

Pour retirer la bannière « development mode », passer en clés
`pk_live_` / `sk_live_` et ajouter le domaine dans le dashboard Clerk.

## Vérification

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://phronesis-seven-neon.vercel.app/dossiers
# Attendu : 200 après DATABASE_URL configuré
```
