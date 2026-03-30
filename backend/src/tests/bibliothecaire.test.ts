import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import dotenv from "dotenv";
import { genererNomUnique, nettoyerEmpruntsClient, nettoyerUtilisateurParNom } from "./helpers/testHelpers.js";

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

test("Bibliothecaire : ajoute un auteur et un livre avec exemplaire par defaut", async () => {
    const auteurNom = genererNomUnique("biblio_test_auteur_default");
    const livreTitre = genererNomUnique("biblio_test_livre_default");

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

        const catalogue = await bibliothecaireService.listerCatalogue();
        const livreCree = catalogue.find(livre => livre.id === livreId);
        assert.ok(livreCree);
        assert.ok((livreCree?.exemplaires.length || 0) >= 1);
    } finally {
        if (livreId) await bibliothecaireService.supprimerLivre(livreId).catch(() => undefined);
        if (auteurId) await bibliothecaireService.supprimerAuteur({ auteurId, force: true }).catch(() => undefined);
    }
});

test("Bibliothecaire : cree un emprunt puis confirme le retour", async () => {
    const auteurNom = genererNomUnique("biblio_test_auteur_emprunt");
    const livreTitre = genererNomUnique("biblio_test_livre_emprunt");
    const clientUsername = genererNomUnique("biblio_test_client_emprunt");

    let auteurId: number | undefined;
    let livreId: number | undefined;
    let clientUserId: number | undefined;

    try {
        const creationClient = await userService.registerClientUser(clientUsername, "Testclient123!");
        assert.equal(creationClient.status, "success");
        assert.ok(creationClient.user);
        clientUserId = creationClient.user?.id;
        assert.ok(clientUserId);

        const souscription = await clientService.souscrireAbonnement(clientUserId!, { dureeMois: 1 });
        assert.equal(souscription.status, "succes");
        assert.ok(souscription.abonnement);

        const auteurCreation = await bibliothecaireService.ajouterAuteur(auteurNom);
        assert.equal(auteurCreation.status, "succes");
        assert.ok(auteurCreation.id);
        auteurId = auteurCreation.id;

        const livreCreation = await bibliothecaireService.ajouterLivre({ titre: livreTitre, auteurIds: [auteurId] });
        assert.equal(livreCreation.status, "succes");
        assert.ok(livreCreation.id);
        livreId = livreCreation.id;

        const ajoutExemplaire = await bibliothecaireService.ajouterExemplaire({ livreId });
        assert.equal(ajoutExemplaire.status, "succes");

        const catalogue = await bibliothecaireService.listerCatalogue();
        const livreCree = catalogue.find(livre => livre.id === livreId);
        assert.ok(livreCree);
        assert.equal(livreCree?.titre, livreTitre);
        assert.ok((livreCree?.exemplaires.length || 0) >= 2);

        const ajoutEmprunt = await bibliothecaireService.ajouterEmpruntBibliothecaire({
            codeSerieAbonnement: souscription.abonnement!.codeSerie,
            livreId
        });
        assert.equal(ajoutEmprunt.status, "succes");

        const empruntsClient = await bibliothecaireService.listerEmpruntsClient(clientUserId!);
        const totalAvantRetour = empruntsClient.empruntsActifs.length + empruntsClient.empruntsEnRetard.length;
        assert.equal(totalAvantRetour, 1);

        const empruntId = empruntsClient.empruntsActifs[0]?.id ?? empruntsClient.empruntsEnRetard[0]?.id;
        assert.ok(empruntId);

        const retour = await bibliothecaireService.confirmerRetourEmprunt(empruntId!);
        assert.equal(retour, "succes");

        const empruntsApresRetour = await bibliothecaireService.listerEmpruntsClient(clientUserId!);
        const totalApresRetour = empruntsApresRetour.empruntsActifs.length + empruntsApresRetour.empruntsEnRetard.length;
        assert.equal(totalApresRetour, 0);
    } finally {
        await nettoyerEmpruntsClient(bibliothecaireService, clientUserId);

        if (livreId) await bibliothecaireService.supprimerLivre(livreId).catch(() => undefined);
        if (auteurId) await bibliothecaireService.supprimerAuteur({ auteurId, force: true }).catch(() => undefined);
        await nettoyerUtilisateurParNom(userService, clientUsername);
    }
});

test("Bibliothecaire : bloque un doublon d'emprunt sur le meme livre", async () => {
    const auteurNom = genererNomUnique("biblio_test_auteur_duplicate");
    const livreTitre = genererNomUnique("biblio_test_livre_duplicate");
    const clientUsername = genererNomUnique("biblio_test_client_duplicate");

    let auteurId: number | undefined;
    let livreId: number | undefined;
    let clientUserId: number | undefined;

    try {
        const creationClient = await userService.registerClientUser(clientUsername, "Testclient123!");
        assert.equal(creationClient.status, "success");
        clientUserId = creationClient.user?.id;
        assert.ok(clientUserId);

        const souscription = await clientService.souscrireAbonnement(clientUserId!, { dureeMois: 1 });
        assert.equal(souscription.status, "succes");
        assert.ok(souscription.abonnement);

        const auteurCreation = await bibliothecaireService.ajouterAuteur(auteurNom);
        assert.equal(auteurCreation.status, "succes");
        auteurId = auteurCreation.id;
        assert.ok(auteurId);

        const livreCreation = await bibliothecaireService.ajouterLivre({ titre: livreTitre, auteurIds: [auteurId] });
        assert.equal(livreCreation.status, "succes");
        livreId = livreCreation.id;
        assert.ok(livreId);

        const premierEmprunt = await bibliothecaireService.ajouterEmpruntBibliothecaire({
            codeSerieAbonnement: souscription.abonnement!.codeSerie,
            livreId
        });
        assert.equal(premierEmprunt.status, "succes");

        const secondEmprunt = await bibliothecaireService.ajouterEmpruntBibliothecaire({
            codeSerieAbonnement: souscription.abonnement!.codeSerie,
            livreId
        });
        assert.equal(secondEmprunt.status, "deja_un_emprunt_du_livre");
    } finally {
        await nettoyerEmpruntsClient(bibliothecaireService, clientUserId);
        if (livreId) await bibliothecaireService.supprimerLivre(livreId).catch(() => undefined);
        if (auteurId) await bibliothecaireService.supprimerAuteur({ auteurId, force: true }).catch(() => undefined);
        await nettoyerUtilisateurParNom(userService, clientUsername);
    }
});
