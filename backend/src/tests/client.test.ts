import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import dotenv from "dotenv";
import { genererNomUnique, nettoyerUtilisateurParNom } from "./helpers/testHelpers.js";

dotenv.config();

let db: typeof import("../db/initDatabase.js");
let bibliothecaireService: typeof import("../services/bibliothecaireService.js");
let clientService: typeof import("../services/clientService.js");
let userService: typeof import("../services/userService.js");

before(async () => {
    db = await import("../db/initDatabase.js");
    bibliothecaireService = await import("../services/bibliothecaireService.js");
    clientService = await import("../services/clientService.js");
    userService = await import("../services/userService.js");
    await db.initDatabase();
});

after(async () => {
    await db.closeDatabase();
});

test("Client : refuse une duree d'abonnement invalide", async () => {
    const clientUsername = genererNomUnique("client_test_invalid_duration");

    try {
        const creationClient = await userService.registerClientUser(clientUsername, "Testclient123!");
        assert.equal(creationClient.status, "success");
        assert.ok(creationClient.user);

        const souscription = await clientService.souscrireAbonnement(creationClient.user!.id, { dureeMois: 2 });
        assert.equal(souscription.status, "duree_invalide");
    } finally {
        await nettoyerUtilisateurParNom(userService, clientUsername);
    }
});

test("Client : souscrit, etend puis resilie son abonnement", async () => {
    const clientUsername = genererNomUnique("client_test_subscription_lifecycle");

    try {
        const creationClient = await userService.registerClientUser(clientUsername, "Testclient123!");
        assert.equal(creationClient.status, "success");
        assert.ok(creationClient.user);

        const clientUserId = creationClient.user!.id;

        const abonnementInitial = await clientService.obtenirAbonnementClient(clientUserId);
        assert.equal(abonnementInitial.statut, "aucun");

        const souscription = await clientService.souscrireAbonnement(clientUserId, { dureeMois: 1 });
        assert.equal(souscription.status, "succes");
        assert.ok(souscription.abonnement);
        assert.equal(souscription.abonnement?.statut, "actif");

        const extension = await clientService.etendreAbonnement(clientUserId, { dureeMois: 1 });
        assert.equal(extension.status, "succes");
        assert.ok(extension.abonnement);

        const resiliation = await clientService.resilierAbonnement(clientUserId);
        assert.equal(resiliation.status, "succes");

        const abonnementFinal = await clientService.obtenirAbonnementClient(clientUserId);
        assert.equal(abonnementFinal.statut, "aucun");
    } finally {
        await nettoyerUtilisateurParNom(userService, clientUsername);
    }
});

test("Client : retrouve l'utilisateur via un code serie actif", async () => {
    const clientUsername = genererNomUnique("client_test_active_code");

    try {
        const creationClient = await userService.registerClientUser(clientUsername, "Testclient123!");
        assert.equal(creationClient.status, "success");
        assert.ok(creationClient.user);

        const clientUserId = creationClient.user!.id;
        const souscription = await clientService.souscrireAbonnement(clientUserId, { dureeMois: 1 });
        assert.equal(souscription.status, "succes");
        assert.ok(souscription.abonnement);

        const userIdTrouve = await clientService.trouverUserIdClientActifParCodeSerie(souscription.abonnement!.codeSerie);
        assert.equal(userIdTrouve, clientUserId);
    } finally {
        await nettoyerUtilisateurParNom(userService, clientUsername);
    }
});

test("Client : consulte le catalogue disponible", async () => {
    const auteurNom = genererNomUnique("client_test_auteur_catalogue");
    const livreTitre = genererNomUnique("client_test_livre_catalogue");

    let auteurId: number | undefined;
    let livreId: number | undefined;

    try {
        const auteurCreation = await bibliothecaireService.ajouterAuteur(auteurNom);
        assert.equal(auteurCreation.status, "succes");
        assert.ok(auteurCreation.id);
        auteurId = auteurCreation.id;

        const livreCreation = await bibliothecaireService.ajouterLivre({ titre: livreTitre, auteurIds: [auteurId] });
        assert.equal(livreCreation.status, "succes");
        assert.ok(livreCreation.id);
        livreId = livreCreation.id;

        const catalogue = await clientService.listerCatalogueDisponibleClient();
        const livreCatalogue = catalogue.find(item => item.livreId === livreId);
        assert.ok(livreCatalogue);
        assert.equal(livreCatalogue?.titreLivre, livreTitre);
        assert.ok((livreCatalogue?.exemplairesDisponibles || 0) >= 1);
    } finally {
        if (livreId) await bibliothecaireService.supprimerLivre(livreId).catch(() => undefined);
        if (auteurId) await bibliothecaireService.supprimerAuteur({ auteurId, force: true }).catch(() => undefined);
    }
});
