import bcrypt from "bcrypt";
import { getBcryptSaltRounds } from "../constants/security.js";
import { pool, query } from "./postgres.js";
import { generateUniqueToken } from "../services/userService.js";

async function ensureSchema(): Promise<void> {
    await query(`
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_utilisateur') THEN
        CREATE TYPE role_utilisateur AS ENUM ('admin', 'client', 'bibliothecaire');
    END IF;
END
$$;
`);

    await query(`
CREATE TABLE IF NOT EXISTS utilisateur (
    id_utilisateur  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    identifiant     VARCHAR(50) NOT NULL UNIQUE,
    mdpbcrypt       VARCHAR(60) NOT NULL,
    token_utilisateur VARCHAR(50) NOT NULL UNIQUE,
    role            role_utilisateur NOT NULL
);
`);

    await query(`
CREATE TABLE IF NOT EXISTS abonnement (
    id_abonnement   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur  INTEGER UNIQUE
                    REFERENCES utilisateur(id_utilisateur)
                    ON DELETE CASCADE,
    code_serie      CHAR(6) NOT NULL UNIQUE,
    date_fin        TIMESTAMP NOT NULL
);
`);

    await query(`
CREATE TABLE IF NOT EXISTS livre (
    id_livre    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titre       VARCHAR(50) NOT NULL
);
`);

    await query(`
CREATE TABLE IF NOT EXISTS exemplaire (
    id_exemplaire   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_livre        INTEGER NOT NULL
                    REFERENCES livre(id_livre)
                    ON DELETE CASCADE
);
`);

    await query(`
CREATE TABLE IF NOT EXISTS auteur (
    id_auteur   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_auteur  VARCHAR(50) NOT NULL
);
`);

    await query(`
CREATE TABLE IF NOT EXISTS auteur_livre (
    id_auteur   INTEGER REFERENCES auteur(id_auteur) ON DELETE CASCADE,
    id_livre    INTEGER REFERENCES livre(id_livre) ON DELETE CASCADE,
    PRIMARY KEY (id_auteur, id_livre)
);
`);

    await query(`
CREATE TABLE IF NOT EXISTS emprunt (
    id_utilisateur          INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
    id_exemplaire           INTEGER NOT NULL UNIQUE REFERENCES exemplaire(id_exemplaire),
    date_debut              TIMESTAMP NOT NULL,
    date_retour_effectif    TIMESTAMP NOT NULL,
    PRIMARY KEY (id_exemplaire)
);
`);
}

async function ensureAdminFromEnv(): Promise<void> {
    const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminPassword) {
        throw new Error("ADMIN_PASSWORD manquant dans .env");
    }

    const existing = await query<{
        id_utilisateur: number;
        mdpbcrypt: string;
        token_utilisateur: string;
        role: "admin" | "client" | "bibliothecaire";
    }>(
        "SELECT id_utilisateur, mdpbcrypt, token_utilisateur, role FROM utilisateur WHERE identifiant = $1 LIMIT 1",
        [adminUsername]
    );

    if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, getBcryptSaltRounds());
        const adminToken = await generateUniqueToken(50);
        await query(
            "INSERT INTO utilisateur (identifiant, mdpbcrypt, token_utilisateur, role) VALUES ($1, $2, $3, 'admin')",
            [adminUsername, hash, adminToken]
        );
        return;
    }

    const admin = existing.rows[0];
    const shouldUpdatePassword = !(await bcrypt.compare(adminPassword, admin.mdpbcrypt));

    if (admin.role !== "admin" || shouldUpdatePassword) {
        const nextHash = shouldUpdatePassword ? await bcrypt.hash(adminPassword, getBcryptSaltRounds()) : admin.mdpbcrypt;
        await query(
            "UPDATE utilisateur SET role = 'admin', mdpbcrypt = $1 WHERE id_utilisateur = $2",
            [nextHash, admin.id_utilisateur]
        );
    }
}

export async function initDatabase(): Promise<void> {
    await ensureSchema();
    await ensureAdminFromEnv();
}

export async function closeDatabase(): Promise<void> {
    await pool.end();
}
