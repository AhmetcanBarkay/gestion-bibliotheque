import { closeDatabase, initDatabase } from "../db/initDatabase.js";
import {
    ajouterAuteur,
    ajouterEmpruntBibliothecaire,
    ajouterExemplaire,
    ajouterLivre,
    listerAuteurs,
    listerCatalogue,
    modifierLivre
} from "../services/bibliothecaireService.js";
import { souscrireAbonnement, trouverUserIdClientActifParCodeSerie } from "../services/clientService.js";
import { createBibliothecaireUser, getUserByUsername, registerClientUser } from "../services/userService.js";
import { query } from "../db/postgres.js";

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
            console.warn(`[seed:test-data] Compte existant ${BIBLIOTHECAIRE_USERNAME} ignore (role actuel: ${existing.role}).`);
        }
        return;
    }

    const created = await createBibliothecaireUser(BIBLIOTHECAIRE_USERNAME, BIBLIOTHECAIRE_PASSWORD);
    if (created.status !== "success" && created.status !== "user_exists") {
        throw new Error("Impossible de creer le compte bibliothecaire de test");
    }
}

async function ensureClientAbonne(clientSeed: ClientSeed): Promise<{ username: string; password: string; codeSerie: string } | undefined> {
    const existing = await getUserByUsername(clientSeed.username);
    let userId: number | undefined;

    if (existing) {
        if (existing.role !== "client") {
            console.warn(`[seed:test-data] Compte existant ${clientSeed.username} ignore (role actuel: ${existing.role}).`);
            return undefined;
        }
        userId = existing.id;
    }

    if (!userId) {
        const created = await registerClientUser(clientSeed.username, clientSeed.password);
        if (created.status === "success" && created.user) {
            userId = created.user.id;
        } else if (created.status === "user_exists") {
            const user = await getUserByUsername(clientSeed.username);
            if (user?.role === "client") {
                userId = user.id;
            }
        }
    }

    if (!userId) {
        console.warn(`[seed:test-data] Client ${clientSeed.username} non seed (creation impossible).`);
        return undefined;
    }

    const abonnement = await souscrireAbonnement(userId, { dureeMois: clientSeed.dureeMois });
    if (abonnement.status !== "succes" || !abonnement.abonnement) {
        console.warn(`[seed:test-data] Abonnement non cree pour ${clientSeed.username}.`);
        return undefined;
    }

    return {
        username: clientSeed.username,
        password: clientSeed.password,
        codeSerie: abonnement.abonnement.codeSerie
    };
}

async function ensureEmpruntEnRetardAncien(codeSerieAbonnement: string, titreLivreCible: string): Promise<void> {
    const clientUserId = await trouverUserIdClientActifParCodeSerie(codeSerieAbonnement);
    if (!clientUserId) {
        throw new Error("Impossible de retrouver le client actif pour creer l'emprunt en retard");
    }

    const catalogue = await listerCatalogue();
    const livreCible = catalogue.find(livre => livre.titre.toLowerCase() === titreLivreCible.toLowerCase());
    if (!livreCible) {
        throw new Error(`Livre cible introuvable pour l'emprunt en retard: ${titreLivreCible}`);
    }

    const empruntsClientAvant = await query<{ id_emprunt: number; id_exemplaire: number; id_livre: number }>(
        `SELECT em.id_emprunt, e.id_exemplaire, e.id_livre
         FROM emprunt em
         JOIN exemplaire e ON e.id_exemplaire = em.id_exemplaire
         WHERE em.id_utilisateur = $1`,
        [clientUserId]
    );

    if (empruntsClientAvant.rows.length === 0) {
        const ajoutResult = await ajouterEmpruntBibliothecaire({
            codeSerieAbonnement,
            livreId: livreCible.id
        });

        if (ajoutResult.status !== "succes" && ajoutResult.status !== "deja_un_emprunt_du_livre") {
            throw new Error(`Impossible de creer l'emprunt initial pour le retard: ${ajoutResult.status}`);
        }
    }

    const empruntsClientApres = await query<{ id_emprunt: number; id_exemplaire: number; id_livre: number }>(
        `SELECT em.id_emprunt, e.id_exemplaire, e.id_livre
         FROM emprunt em
         JOIN exemplaire e ON e.id_exemplaire = em.id_exemplaire
         WHERE em.id_utilisateur = $1
         ORDER BY em.id_emprunt ASC`,
        [clientUserId]
    );

    if (empruntsClientApres.rows.length === 0) {
        throw new Error("Aucun emprunt trouve pour positionner un retard ancien");
    }

    const empruntCible =
        empruntsClientApres.rows.find(emprunt => emprunt.id_livre === livreCible.id) ?? empruntsClientApres.rows[0];

    await query(
        `UPDATE emprunt
         SET date_debut = CURRENT_TIMESTAMP - INTERVAL '20 days',
             date_retour_effectif = CURRENT_TIMESTAMP - INTERVAL '12 days'
         WHERE id_emprunt = $1`,
        [empruntCible.id_emprunt]
    );
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
        if (seededClient) {
            clientsSeedes.push(seededClient);
        }
    }

    const clientPourRetard = clientsSeedes.find(client => client.codeSerie.trim().length > 0);
    if (clientPourRetard) {
        await ensureEmpruntEnRetardAncien(clientPourRetard.codeSerie, "Le Petit Prince");
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
    if (clientPourRetard) {
        console.log(`[seed:test-data] Emprunt en retard ancien force pour: ${clientPourRetard.username}`);
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
