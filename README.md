# AXON INTELLECT

Refonte React de la plateforme d’apprentissage AXON, organisée en monolithe modulaire avec applications client et serveur séparées, sur le modèle de `F:\erp`.

```text
apps/
├── client/   React + Vite + TypeScript (port 5173)
└── server/   API Express + Drizzle + PostgreSQL (port 4000)
```

## Démarrage

1. Installer Node.js 20+ et PostgreSQL.
2. Le fichier `.env.local` à la racine est chargé par Vite et par le serveur. Il fournit `DATABASE_URL`, les clés Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) et, pour l’IA, `NEXT_PUBLIC_GROQ_API_KEY` ou `GROQ_API_KEY`.
3. À la racine : `npm install` puis `npm run install:all`.
4. La base AXON existante est réutilisée. **Ne lancez pas de migration initiale** sur cette base : elle contient déjà les tables et données du projet source. `db:generate`/`db:migrate` restent réservés aux évolutions de schéma explicitement nécessaires.
5. Démarrer client et API avec `npm run dev`.

Connectez-vous avec votre compte Clerk existant. Les options, niveaux, cours, chapitres et profils sont lus depuis la base AXON configurée.

## Architecture client (`apps/client/src`)

`pages/`, `components/`, `layouts/`, `context/`, `hooks/` et `services/` gardent les vues, l’état d’authentification et les appels HTTP séparés.

## Architecture serveur (`apps/server/src`)

`routes/` expose le profil, le catalogue, le cursus, la progression et l’IA ; `db/` contient Drizzle et le schéma ; `middleware/` valide les jetons Clerk.

## Configuration

- `DATABASE_URL` : URL PostgreSQL.
- `CLIENT_URL` : origine du client, par défaut `http://localhost:5173`.
- `CLERK_SECRET_KEY` : clé serveur Clerk.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` : clé publique Clerk, consommée côté client et serveur.
- `GROQ_API_KEY` ou `NEXT_PUBLIC_GROQ_API_KEY` : facultative, utilisée par l’assistant et la correction IA (la clé est uniquement envoyée au serveur).
