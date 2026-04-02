import bcrypt from "bcrypt";
import { getBcryptSaltRounds } from "../constants/security.js";
import { pool, query } from "./postgres.js";
import { generateUniqueToken } from "../services/userService.js";
import { Role } from "@shared/types/roles.js";

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
    token           VARCHAR(50) NOT NULL UNIQUE,
    role            role_utilisateur NOT NULL
);
`);
    // Migration de token_utilisateur a token dans utilisateur
    try {
        await query("ALTER TABLE utilisateur RENAME token_utilisateur TO token;");
    } catch (error: unknown) {

    };

    await query(`
CREATE OR REPLACE FUNCTION interdire_modification_role_utilisateur()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Modification du role interdite';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`);

    await query(`
DROP TRIGGER IF EXISTS trig_interdire_modification_role_utilisateur ON utilisateur;
CREATE TRIGGER trig_interdire_modification_role_utilisateur
BEFORE UPDATE OF role ON utilisateur
FOR EACH ROW
EXECUTE FUNCTION interdire_modification_role_utilisateur();
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
    id_auteur   INTEGER REFERENCES auteur(id_auteur) ON DELETE RESTRICT,
    id_livre    INTEGER REFERENCES livre(id_livre) ON DELETE CASCADE,
    PRIMARY KEY (id_auteur, id_livre)
);
`);

    await query(`
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'auteur_livre_id_auteur_fkey'
          AND table_name = 'auteur_livre'
    ) THEN
        ALTER TABLE auteur_livre DROP CONSTRAINT auteur_livre_id_auteur_fkey;
    END IF;

    ALTER TABLE auteur_livre
        ADD CONSTRAINT auteur_livre_id_auteur_fkey
        FOREIGN KEY (id_auteur)
        REFERENCES auteur(id_auteur)
        ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;
`);

    await query(`
CREATE TABLE IF NOT EXISTS emprunt (
    id_emprunt              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur          INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
    id_exemplaire           INTEGER NOT NULL UNIQUE REFERENCES exemplaire(id_exemplaire),
    date_debut              TIMESTAMP NOT NULL,
    date_retour_effectif    TIMESTAMP NOT NULL
);
`);
};


async function ensureAdminFromEnv(): Promise<void> {
    const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminPassword) {
        throw new Error("ADMIN_PASSWORD manquant dans .env");
    }

    const existing = await query<{
        id_utilisateur: number;
        mdpbcrypt: string;
        token: string;
        role: Role;
    }>(
        "SELECT id_utilisateur, mdpbcrypt, token, role FROM utilisateur WHERE identifiant = $1 LIMIT 1",
        [adminUsername]
    )
    if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, getBcryptSaltRounds());
        const adminToken = await generateUniqueToken(50);
        await query(
            "INSERT INTO utilisateur (identifiant, mdpbcrypt, token, role) VALUES ($1, $2, $3, 'admin')",
            [adminUsername, hash, adminToken]
        );
        return;
    }

    const admin = existing.rows[0];
    const shouldUpdatePassword = !(await bcrypt.compare(adminPassword, admin.mdpbcrypt));

    if (admin.role !== "admin") {
        throw new Error(
            `Le compte ${adminUsername} existe deja avec le role ${admin.role}. Le role ne peut pas etre modifie apres creation.`
        );
    }

    if (shouldUpdatePassword) {
        const nextHash = await bcrypt.hash(adminPassword, getBcryptSaltRounds());
        await query(
            "UPDATE utilisateur SET mdpbcrypt = $1 WHERE id_utilisateur = $2",
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
