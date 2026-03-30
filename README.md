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
- Un livre peut avoir zéro, un ou plusieurs auteurs (et vice versa).
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
DATABASE_URL=postgres://votre_user:votre_mot_de_passe@127.0.0.1:5432/gestion_bibliotheque
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
BCRYPT_SALT_ROUNDS=10
```

Notes:

- `BCRYPT_SALT_ROUNDS` est optionnel (entier 4..31). Valeur par défaut: 10.
- Au démarrage backend, le schéma est initialisé et le compte admin est garanti.

3. Démarrer l'application en développement:

```bash
npm run dev:backend
npm run dev:frontend
```

URLs locales:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Comment tester l'application

Tests techniques rapides:

```bash
npm run build
```

Ce script compile backend + frontend et valide que l'application build correctement.

Initialisation rapide des donnees de test:

```bash
npm run seed:test-data
```

Ce script ajoute des donnees de base via les services backend:

- 6 livres
- 6 auteurs lies a ces livres
- 2 livres avec 3 exemplaires
- 2 livres avec 2 exemplaires
- 2 livres avec 1 exemplaire
- 1 compte bibliothecaire de test
- 2 comptes clients de test avec abonnement actif

Identifiants du compte bibliothecaire de test (affiches aussi en sortie de script):

- Username: `bibliothecaire_test`
- Mot de passe: `Testbiblio123!`

Identifiants des comptes clients abonnes de test (affiches aussi en sortie de script):

- Username: `client_test_1`
- Username: `client_test_2`
- Mot de passe (les 2 comptes): `Testclient123!`
- Code serie: affiche dans la sortie du script

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
- `npm run seed:test-data`: ajoute des donnees de base de test (livres, exemplaires, compte bibliothecaire).
- `npm run start`: lance le backend compilé.