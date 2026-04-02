# gestion-bibliotheque

Application fullstack de gestion de bibliothèque (administration, catalogue, emprunts, abonnement client).

## URL GitHub

- https://github.com/AhmetcanBarkay/gestion-bibliotheque

## Stack technique

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Base de données: PostgreSQL

## Liste des fonctionnalités (Diagramme des Use Case)

Le diagramme de cas d'utilisation est disponible ci-dessous:

![Diagramme use case](illustrations/use_cases.png)

Fonctionnalités principales:

- Client: créer un compte, se connecter, consulter ses emprunts, consulter le catalogue, gérer son abonnement, changer son mot de passe.
- Bibliothécaire: gérer les auteurs, livres et exemplaires, créer des emprunts, confirmer les retours, changer son mot de passe.
- Administrateur: gérer les comptes bibliothécaires.

## Données manipulées (Modèle Entité-Association)

Le MCD actuel est le suivant:

![MCD de l'application](illustrations/mcd.png)

Entités manipulées:

- `utilisateur`: identifiant, mot de passe hashé, rôle.
- `abonnement`: code série, date de fin.
- `livre`: titre.
- `auteur`: nom.
- `exemplaire`: exemplaire physique d'un livre.
- `emprunt`: historique des emprunts avec dates.

Relations importantes:

- Un utilisateur peut avoir plusieurs emprunts.
- Un exemplaire appartient à un seul livre.
- Un livre peut avoir plusieurs exemplaires.
- Un livre doit avoir au moins un auteur (et peut en avoir plusieurs).
- Lors de l'ajout d'un auteur, il n'est lié à aucun livre, puis peut être lié lors de l'ajout ou de la modification d'un livre.
- Un auteur ne peut pas être supprimé tant qu'il est lié à au moins un livre.
- Un utilisateur peut avoir un abonnement.

## Contraintes métier d'emprunt

- Maximum 5 emprunts actifs par client.
- Emprunt bloqué si au moins un emprunt est en retard.
- Emprunt bloqué si le client possède déjà un exemplaire actif du même livre.

Déroulement d'un emprunt:

1. Le client souscrit un abonnement et obtient un code série.
2. Le client vient en physique à la bibliothèque et donne ce code série.
3. Le bibliothécaire sélectionne un livre, puis un exemplaire disponible, et valide.
4. Le backend vérifie les règles métier.
5. Si tout est valide, l'emprunt est créé, sinon un motif de refus est renvoyé.

## Installation et lancement

Prérequis:

- Node.js 20+
- npm 10+
- PostgreSQL

1. Installer les dépendances depuis la racine:

```bash
npm install
```

2. Créer le fichier `.env` à la racine (à partir de `.env.example`):

```env
PORT=3000
DATABASE_URL=postgres://votre_user:votre_mot_de_passe@127.0.0.1:5432/nom_base_de_donnees
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
BCRYPT_SALT_ROUNDS=10
```

Notes:

- `BCRYPT_SALT_ROUNDS` est optionnel (entier 4..31). Valeur par défaut: 10.
- Au démarrage backend, le schéma est initialisé et le compte admin est garanti.

3. Démarrer l'application en développement (2 terminaux recommandés):

Terminal 1 (backend API):

```bash
npm run dev:backend
```

Terminal 2 (frontend Vite):

```bash
npm run dev:frontend
```

Les deux processus doivent tourner en même temps en mode dev:

- le backend expose l'API (port 3000 par défaut)
- le frontend sert l'interface web (port 5173 par défaut)

Si un seul des deux est lancé, l'application sera partiellement utilisable.

URLs locales:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Limites de sécurité (mode test actuel):

- `POST /auth/login`: 10 tentatives maximum par 15 minutes
- `POST /auth/register`: 20 créations de comptes maximum par 15 minutes
- `Toutes les routes /client`: 300 requêtes maximum par IP sur 15 minutes

## Comment tester l'application

Tests techniques rapides:

```bash
npm run build
```

Ce script compile backend + frontend et valide que l'application build correctement.

Tests unitaires:

```bash
npm run test
```

Ce script lance tous les tests du dossier `backend/src/tests`.
Il exécute automatiquement tous les fichiers `*.test.ts` dans `backend/src/tests`.
Il couvre les fonctionnalités des rôles, de l'authentification et des triggers avec des fichiers séparés:

- admin
- bibliothécaire
- client
- auth
- trigger

Initialisation rapide des données de test:

```bash
npm run seed-test-data
```

Ce script ajoute des données de base via les services backend:

- 6 livres
- 6 auteurs liés à ces livres
- 2 livres avec 3 exemplaires
- 2 livres avec 2 exemplaires
- 2 livres avec 1 exemplaire
- 1 compte bibliothécaire de test
- 2 comptes clients de test avec abonnement actif
- 1 emprunt ancien forcé en retard pour un client de test

Identifiants du compte bibliothécaire de test (affichés aussi en sortie de script):

- Username: `bibliothecaire_test`
- Mot de passe: `Testbiblio123!`

Identifiants des comptes clients abonnés de test (affichés aussi en sortie de script):

- Username: `client_test_1`
- Username: `client_test_2`
- Mot de passe (les 2 comptes): `Testclient123!`
- Code série: affiché dans la sortie du script

Tests fonctionnels manuels recommandés:

1. Se connecter avec le compte admin (défini par `ADMIN_USERNAME` / `ADMIN_PASSWORD` dans `.env`).
2. Créer un compte bibliothécaire depuis l'espace admin.
3. Créer un compte client puis se connecter.
4. Souscrire un abonnement et récupérer le code série.
5. Se connecter en bibliothécaire et créer un emprunt avec ce code série.
6. Vérifier les blocages métier (retard, limite, doublon de livre).
7. Vérifier le changement de mot de passe (client et bibliothécaire).

## Scripts utiles

- `npm run dev:backend`: démarre le backend en watch.
- `npm run dev:frontend`: démarre le frontend Vite.
- `npm run build:backend`: compile le backend.
- `npm run build:frontend`: compile le frontend.
- `npm run build`: build complet backend + frontend.
- `npm run test`: lance tous les tests du dossier `backend/src/tests`.
- `npm run seed-test-data`: ajoute des données de base de test (livres, exemplaires, compte bibliothécaire).
- `npm run start`: lance le backend compilé.