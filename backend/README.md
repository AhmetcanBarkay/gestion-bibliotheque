# LeChat Backend

Backend simple en TypeScript avec Node.js et Express.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à la racine du projet backend :

```
PORT=3000
NODE_ENV=development
```

## Démarrage

### Mode développement
```bash
npm run dev
```

### Build et production
```bash
npm run build
npm start
```

## Routes disponibles

- `GET /` - Page d'accueil de l'API
- `GET /api/health` - Vérification du statut de l'API
- `GET /api/messages` - Récupérer tous les messages
- `POST /api/messages` - Créer un nouveau message

### Exemple de requête POST

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text": "Mon message", "author": "John"}'
```

## Structure du projet

```
backend/
├── src/
│   └── index.ts      # Point d'entrée de l'application
├── dist/             # Fichiers compilés (généré après build)
├── package.json
├── tsconfig.json
└── .env
```
