import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import dotenv from "dotenv";
import { query } from "../db/postgres.js";
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

test("Trigger : interdit la modification du role d'un utilisateur existant", async () => {
    const username = genererNomUnique("trigger_role_immutable");
    const password = "Testclient123!";

    try {
        const creation = await userService.registerClientUser(username, password);
        assert.equal(creation.status, "success");
        assert.ok(creation.user);

        await assert.rejects(
            async () => {
                await query(
                    "UPDATE utilisateur SET role = $1 WHERE id_utilisateur = $2",
                    ["bibliothecaire", creation.user!.id]
                );
            },
            /Modification du role interdite/
        );

        const userApresUpdate = await userService.getUserByUsername(username);
        assert.ok(userApresUpdate);
        assert.equal(userApresUpdate?.role, "client");
    } finally {
        await nettoyerUtilisateurParNom(userService, username);
    }
});