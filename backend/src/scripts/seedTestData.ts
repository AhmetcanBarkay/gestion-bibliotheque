import { closeDatabase, initDatabase } from "../db/initDatabase.js";
import {
    ajouterAuteur,
    ajouterExemplaire,
    ajouterLivre,
    listerAuteurs,
    listerCatalogue,
    modifierLivre
} from "../services/bibliothecaireService.js";
import { souscrireAbonnement } from "../services/clientService.js";
import { createBibliothecaireUser, deleteUserById, getUserByUsername, registerClientUser } from "../services/userService.js";

type LivreSeed = {
    titre: string;
    totalExemplaires: number;
    auteurs: string[];
};

const LIVRES_AJOUT = [
    { titre: "Le Petit Prince", totalExemplaires: 3, auteurs: ["Antoine de Saint-Exupery"] },
    { titre: "L'Etranger", totalExemplaires: 3, auteurs: ["Albert Camus"] },
    { titre: "Germinal", totalExemplaires: 2, auteurs: ["Emile Zola"] },
    { titre: "Candide", totalExemplaires: 2, auteurs: ["Voltaire"] },
    { titre: "Madame Bovary", totalExemplaires: 1, auteurs: ["Gustave Flaubert"] },
    { titre: "Notre-Dame de Paris", totalExemplaires: 1, auteurs: ["Victor Hugo"] }
] satisfies LivreSeed[];

const BIBLIOTHECAIRE_USERNAME = "bibliothecaire_test";
const BIBLIOTHECAIRE_PASSWORD = "Testbiblio123!";

type ClientSeed = {
    username: string;
    password: string;
    dureeMois: 1 | 3 | 6 | 12;
};

const CLIENTS_AJOUT = [
    { username: "client_test_1", password: "Testclient123!", dureeMois: 12 },
    { username: "client_test_2", password: "Testclient123!", dureeMois: 12 }
] satisfies ClientSeed[];

async function assurerAuteurs(nomsAuteurs: string[]): Promise<number[]> {
    const auteursExistants = await listerAuteurs();
    const auteurIds: number[] = [];

    for (const nomAuteur of nomsAuteurs) {
        const nomNettoye = nomAuteur.trim();
        const auteurExistant = auteursExistants.find(
            auteur => auteur.nom.trim().toLowerCase() === nomNettoye.toLowerCase()
        );

        if (auteurExistant) {
            auteurIds.push(auteurExistant.id);
            continue;
        }

        const creationAuteur = await ajouterAuteur(nomNettoye);
        if (creationAuteur.status === "succes" && creationAuteur.id) {
            auteurIds.push(creationAuteur.id);
            continue;
        }

        if (creationAuteur.status === "existe") {
            const auteursRefresh = await listerAuteurs();
            const auteurTrouve = auteursRefresh.find(
                auteur => auteur.nom.trim().toLowerCase() === nomNettoye.toLowerCase()
            );

            if (auteurTrouve) {
                auteurIds.push(auteurTrouve.id);
                continue;
            }
        }

        throw new Error(`Impossible de creer/trouver l'auteur: ${nomNettoye}`);
    }

    return [...new Set(auteurIds)];
}

async function ensureLivreAndExemplaires(seed: LivreSeed): Promise<void> {
    const auteurIds = await assurerAuteurs(seed.auteurs);
    const catalogue = await listerCatalogue();
    const livreExistant = catalogue.find(l => l.titre.toLowerCase() === seed.titre.toLowerCase());

    let livreId: number;
    let exemplairesActuels = 0;

    if (livreExistant) {
        livreId = livreExistant.id;
        exemplairesActuels = livreExistant.exemplaires.length;

        const miseAJourLivre = await modifierLivre({
            id: livreId,
            titre: seed.titre,
            auteurIds
        });
        if (miseAJourLivre !== "succes") {
            throw new Error(`Impossible de mettre a jour les auteurs du livre: ${seed.titre}`);
        }
    } else {
        const result = await ajouterLivre({ titre: seed.titre, auteurIds });
        if (result.status !== "succes" || !result.id) {
            throw new Error(`Impossible de creer le livre: ${seed.titre}`);
        }

        livreId = result.id;
        exemplairesActuels = 1;
    }

    const exemplairesManquants = Math.max(0, seed.totalExemplaires - exemplairesActuels);
    for (let i = 0; i < exemplairesManquants; i++) {
        const addResult = await ajouterExemplaire({ livreId });
        if (addResult.status !== "succes") {
            throw new Error(`Impossible d'ajouter un exemplaire pour: ${seed.titre}`);
        }
    }
}

async function ensureBibliothecaireCompte(): Promise<void> {
    const existing = await getUserByUsername(BIBLIOTHECAIRE_USERNAME);
    if (existing) {
        if (existing.role !== "bibliothecaire") {
            throw new Error(`Le compte ${BIBLIOTHECAIRE_USERNAME} existe deja avec un autre role`);
        }

        await deleteUserById(existing.id);
    }

    const created = await createBibliothecaireUser(BIBLIOTHECAIRE_USERNAME, BIBLIOTHECAIRE_PASSWORD);
    if (created.status !== "success") {
        throw new Error("Impossible de creer le compte bibliothecaire de test");
    }
}

async function ensureClientAbonne(clientSeed: ClientSeed): Promise<{ username: string; password: string; codeSerie: string }> {
    const existing = await getUserByUsername(clientSeed.username);
    if (existing) {
        if (existing.role !== "client") {
            throw new Error(`Le compte ${clientSeed.username} existe deja avec un autre role`);
        }

        await deleteUserById(existing.id);
    }

    const created = await registerClientUser(clientSeed.username, clientSeed.password);
    if (created.status !== "success" || !created.user) {
        throw new Error(`Impossible de creer le client de test: ${clientSeed.username}`);
    }

    const abonnement = await souscrireAbonnement(created.user.id, { dureeMois: clientSeed.dureeMois });
    if (abonnement.status !== "succes" || !abonnement.abonnement) {
        throw new Error(`Impossible de souscrire l'abonnement pour: ${clientSeed.username}`);
    }

    return {
        username: clientSeed.username,
        password: clientSeed.password,
        codeSerie: abonnement.abonnement.codeSerie
    };
}

async function seed(): Promise<void> {
    await initDatabase();

    for (const livre of LIVRES_AJOUT) {
        await ensureLivreAndExemplaires(livre);
    }

    await ensureBibliothecaireCompte();
    const clientsSeedes: Array<{ username: string; password: string; codeSerie: string }> = [];
    for (const clientSeed of CLIENTS_AJOUT) {
        const seededClient = await ensureClientAbonne(clientSeed);
        clientsSeedes.push(seededClient);
    }

    console.log("[seed:test-data] Donnees de base ajoutees.");
    console.log("[seed:test-data] Livres cibles: 6 (2x3 exemplaires, 2x2 exemplaires, 2x1 exemplaire).");
    console.log("[seed:test-data] Auteurs de base: 6 (lies aux livres seedes).");
    console.log(`[seed:test-data] Compte bibliothecaire: ${BIBLIOTHECAIRE_USERNAME}`);
    console.log(`[seed:test-data] Mot de passe bibliothecaire: ${BIBLIOTHECAIRE_PASSWORD}`);
    console.log("[seed:test-data] Comptes clients abonnes:");
    for (const client of clientsSeedes) {
        console.log(`[seed:test-data] - ${client.username} | mot de passe: ${client.password} | code serie: ${client.codeSerie}`);
    }
}

seed()
    .catch((error) => {
        console.error("[seed:test-data] Echec:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDatabase();
    });
