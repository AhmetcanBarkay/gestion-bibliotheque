# gestion-bibliotheque

Application fullstack de gestion de bibliothèque (administration, gestion du catalogue et des emprunts, espace client).

## Stack technique

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Base de données: PostgreSQL
- Dossier partagé: types/constants mutualisés entre frontend et backend

## Prérequis

- Node.js 20+
- npm 10+
- PostgreSQL

## Installation

Depuis la racine du projet:

```bash
npm install
```

## Configuration (.env)

Créer un fichier `.env` à la racine (voir `.env.example`) avec au minimum:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://votre_user:votre_mot_de_passe@127.0.0.1:5432/gestion_bibliotheque
PG_SSL=false
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
```

Au démarrage backend:

- le schéma PostgreSQL est initialisé si nécessaire,
- le compte admin est garanti,
- le mot de passe admin est synchronisé depuis dans le dossier .env avec `ADMIN_PASSWORD`.

## Contraintes d'emprunt

Les contraintes métier d'emprunt sont appliquées côté backend (source de vérité unique), dans `backend/src/services/bibliothecaireService.ts`.

Règles client en place:

- Un client ne peut pas avoir plus de 5 emprunts actifs simultanés.
- Un client ayant au moins un emprunt en retard ne peut pas emprunter un nouvel exemplaire.
- Un client ne peut pas emprunter deux exemplaires actifs du même livre en même temps.

Comportement attendu:

- Si une règle est violée, l'emprunt est refusé avec un statut métier explicite.
- Le frontend affiche un message utilisateur adapté selon le statut renvoyé par l'API.
- La limite maximale est centralisée dans le backend (`LIMITE_MAX_EMPRUNTS_ACTIFS = 5`).
- L'interface affiche le nombre d'emprunts en cours de l'utilisateur.

### Aide utilisateur (emprunts)

- Si vous avez déjà 5 emprunts actifs, un nouvel emprunt est refusé.
- Si vous avez un emprunt en retard, un nouvel emprunt est refusé.
- Si vous avez déjà un exemplaire d'un livre, vous ne pouvez pas emprunter un 2e exemplaire actif du même livre.
- En cas de refus, l'interface affiche la raison exacte pour vous guider.

## Commandes npm run dev

### Depuis la racine

- `npm run dev:backend`: démarre le backend en mode watch.
- `npm run dev:frontend`: démarre le frontend Vite.

Use case recommandé en développement:

1. Terminal 1: `npm run dev:backend`
2. Terminal 2: `npm run dev:frontend`

URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Depuis backend/

- `npm run dev`: démarre uniquement l'API backend en watch.

### Depuis frontend/

- `npm run dev`: démarre uniquement le client web Vite.

## Autres scripts utiles (racine)

- `npm run build:backend`: build TypeScript backend.
- `npm run build:frontend`: build TypeScript + bundle Vite frontend.
- `npm run build`: build complet (backend + frontend).
- `npm run start`: lance le backend compilé.

## Use case de l'application

Le diagramme de cas d'utilisation est disponible ci-dessous:

![Diagramme use case](illustrations/use_cases.png)

### Acteurs principaux

- Client
- Bibliothécaire
- Administrateur

### Parcours principaux

- Client:
1. Créer un compte
2. S'authentifier
3. Voir ses emprunts
4. Voir le catalogue
5. Souscrire / étendre / résilier son abonnement

- Bibliothécaire:
1. S'authentifier
2. Gérer les auteurs
3. Gérer les livres et exemplaires
4. Consulter les emprunts
5. Ajouter un emprunt et confirmer un retour

- Administrateur:
1. S'authentifier
2. Ajouter / supprimer des comptes bibliothécaires

## MCD (Modèle Conceptuel de Données)

Le MCD actuel est le suivant:

![MCD de l'application](illustrations/mcd.png)

### Entités clés

- `utilisateur`: identifiant, mot de passe hashé, rôle
- `abonnement`: code série, date de fin
- `livre`: titre
- `auteur`: nom
- `exemplaire`: copie physique d'un livre
- `emprunter` (association): historique d'emprunt avec dates

### Relations clés

- Un utilisateur peut avoir plusieurs emprunts.
- Un exemplaire appartient à un seul livre.
- Un livre peut avoir plusieurs exemplaires.
- Un livre peut avoir zéro, un ou plusieurs auteurs (et vice versa).
- Un utilisateur peut avoir un abonnement.