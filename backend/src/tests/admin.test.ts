import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import dotenv from "dotenv";
import { genererNomUnique, nettoyerUtilisateurParNom } from "./helpers/testHelpers.js";

dotenv.config();

let db: typeof import("../db/initDatabase.js");
let adminService: typeof import("../services/adminService.js");
let userService: typeof import("../services/userService.js");

before(async () => {
    db = await import("../db/initDatabase.js");
    adminService = await import("../services/adminService.js");
    userService = await import("../services/userService.js");
    await db.initDatabase();
});

after(async () => {
    await db.closeDatabase();
});

test("Admin : cree et liste un compte bibliothecaire", async () => {
    const bibliothecaireUsername = genererNomUnique("admin_test_biblio");

    try {
        const creation = await adminService.createBibliothecaireAccount(bibliothecaireUsername);
        assert.equal(creation.status, "success");
        assert.ok(creation.id);
        assert.ok(creation.generatedPassword);
        assert.equal(creation.generatedPassword?.length, 12);

        const liste = await adminService.listBibliothecaires();
        assert.equal(liste.some(item => item.username === bibliothecaireUsername), true);
    } finally {
        await nettoyerUtilisateurParNom(userService, bibliothecaireUsername);
    }
});

test("Admin : refuse la creation d'un doublon bibliothecaire", async () => {
    const bibliothecaireUsername = genererNomUnique("admin_test_duplicate_biblio");

    try {
        const premiereCreation = await adminService.createBibliothecaireAccount(bibliothecaireUsername);
        assert.equal(premiereCreation.status, "success");

        const secondeCreation = await adminService.createBibliothecaireAccount(bibliothecaireUsername);
        assert.equal(secondeCreation.status, "user_exists");
    } finally {
        await nettoyerUtilisateurParNom(userService, bibliothecaireUsername);
    }
});

test("Admin : supprime un bibliothecaire existant", async () => {
    const bibliothecaireUsername = genererNomUnique("admin_test_delete_biblio");

    try {
        const creation = await adminService.createBibliothecaireAccount(bibliothecaireUsername);
        assert.equal(creation.status, "success");

        const suppression = await adminService.deleteBibliothecaireAccount(bibliothecaireUsername);
        assert.equal(suppression, "success");

        const userApresSuppression = await userService.getUserByUsername(bibliothecaireUsername);
        assert.equal(userApresSuppression, undefined);
    } finally {
        await nettoyerUtilisateurParNom(userService, bibliothecaireUsername);
    }
});

test("Admin : refuse la suppression d'un compte non bibliothecaire", async () => {
    const clientUsername = genererNomUnique("admin_test_client");

    try {
        const creationClient = await userService.registerClientUser(clientUsername, "Testclient123!");
        assert.equal(creationClient.status, "success");

        const suppression = await adminService.deleteBibliothecaireAccount(clientUsername);
        assert.equal(suppression, "wrong_role");
    } finally {
        await nettoyerUtilisateurParNom(userService, clientUsername);
    }
});

test("Admin : retourne not_found si le compte est introuvable", async () => {
    const usernameInexistant = genererNomUnique("admin_test_missing_biblio");
    const suppression = await adminService.deleteBibliothecaireAccount(usernameInexistant);
    assert.equal(suppression, "not_found");
});
