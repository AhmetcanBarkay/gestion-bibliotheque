import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import dotenv from "dotenv";
import { genererNomUnique, nettoyerUtilisateurParNom } from "./helpers/testHelpers.js";

dotenv.config();

let db: typeof import("../db/initDatabase.js");
let userService: typeof import("../services/userService.js");

before(async () => {
    db = await import("../db/initDatabase.js");
    userService = await import("../services/userService.js");
    await db.initDatabase();
});

after(async () => {
    await db.closeDatabase();
});

test("Auth : inscrit un client puis permet la connexion", async () => {
    const username = genererNomUnique("auth_register_login");
    const password = "Testclient123!";

    try {
        const register = await userService.registerClientUser(username, password);
        assert.equal(register.status, "success");
        assert.ok(register.user);

        const login = await userService.getUserByLogin(username, password);
        assert.ok(login);
        assert.equal(login?.username, username);
        assert.equal(login?.role, "client");
    } finally {
        await nettoyerUtilisateurParNom(userService, username);
    }
});

test("Auth : refuse la connexion avec un mot de passe invalide", async () => {
    const username = genererNomUnique("auth_bad_password");

    try {
        const register = await userService.registerClientUser(username, "Testclient123!");
        assert.equal(register.status, "success");

        const login = await userService.getUserByLogin(username, "WrongPassword123!");
        assert.equal(login, undefined);
    } finally {
        await nettoyerUtilisateurParNom(userService, username);
    }
});

test("Auth : refuse le changement si le mot de passe actuel est incorrect", async () => {
    const username = genererNomUnique("auth_change_wrong_current");

    try {
        const register = await userService.registerClientUser(username, "Testclient123!");
        assert.equal(register.status, "success");
        assert.ok(register.user);

        const result = await userService.changeUserPassword(register.user!.id, "MauvaisActuel123!", "NouveauPass123!");
        assert.equal(result.status, "invalid_current_password");
    } finally {
        await nettoyerUtilisateurParNom(userService, username);
    }
});

test("Auth : change le mot de passe et renouvelle le token", async () => {
    const username = genererNomUnique("auth_change_success");
    const oldPassword = "Testclient123!";
    const newPassword = "NouveauPass123!";

    try {
        const register = await userService.registerClientUser(username, oldPassword);
        assert.equal(register.status, "success");
        assert.ok(register.user);

        const oldToken = register.user!.token;

        const change = await userService.changeUserPassword(register.user!.id, oldPassword, newPassword);
        assert.equal(change.status, "success");
        assert.ok(change.token);
        assert.notEqual(change.token, oldToken);

        const loginOldPassword = await userService.getUserByLogin(username, oldPassword);
        assert.equal(loginOldPassword, undefined);

        const loginNewPassword = await userService.getUserByLogin(username, newPassword);
        assert.ok(loginNewPassword);
    } finally {
        await nettoyerUtilisateurParNom(userService, username);
    }
});

test("Auth : refuse de reutiliser le meme mot de passe", async () => {
    const username = genererNomUnique("auth_change_same_password");
    const password = "Testclient123!";

    try {
        const register = await userService.registerClientUser(username, password);
        assert.equal(register.status, "success");
        assert.ok(register.user);

        const change = await userService.changeUserPassword(register.user!.id, password, password);
        assert.equal(change.status, "same_password");
    } finally {
        await nettoyerUtilisateurParNom(userService, username);
    }
});
