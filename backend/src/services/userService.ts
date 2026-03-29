import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/user.js";
import type { Role } from "@shared/types/roles.js";
import { query } from "../db/postgres.js";

interface DbUserRow {
    id_utilisateur: number;
    identifiant: string;
    mdpbcrypt: string;
    token_utilisateur: string;
    role: Role;
}

function toUser(row: DbUserRow): User {
    return {
        id: row.id_utilisateur,
        username: row.identifiant,
        hashedPassword: row.mdpbcrypt,
        token: row.token_utilisateur,
        role: row.role,
        date_created: new Date()
    };
}

export async function getUserByToken(token: string): Promise<User | undefined> {
    const result = await query<DbUserRow>(
        "SELECT id_utilisateur, identifiant, mdpbcrypt, token_utilisateur, role FROM utilisateur WHERE token_utilisateur = $1 LIMIT 1",
        [token]
    );
    if (result.rows.length === 0) return undefined;
    return toUser(result.rows[0]);
}

export async function getUserById(id: number): Promise<User | undefined> {
    const result = await query<DbUserRow>(
        "SELECT id_utilisateur, identifiant, mdpbcrypt, token_utilisateur, role FROM utilisateur WHERE id_utilisateur = $1 LIMIT 1",
        [id]
    );
    if (result.rows.length === 0) return undefined;
    return toUser(result.rows[0]);
}

export function generateToken(length: number = 50): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    const len = chars.length;
    for (let i = 0; i < length; i++) {
        token += chars.charAt(crypto.randomInt(0, len));
    };
    return token;
};

export async function generateUniqueToken(length: number = 50): Promise<string> {
    for (let i = 0; i < 20; i++) {
        const token = generateToken(length);
        const existing = await query<{ id_utilisateur: number }>(
            "SELECT id_utilisateur FROM utilisateur WHERE token_utilisateur = $1 LIMIT 1",
            [token]
        );
        if (existing.rows.length === 0) return token;
    }

    throw new Error("Impossible de générer un token utilisateur unique");
}

export function generatePassword(length: number = 12): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const specials = "#!?*";
    const all = uppercase + lowercase + digits + specials;

    const chars: string[] = [
        uppercase.charAt(crypto.randomInt(0, uppercase.length)),
        lowercase.charAt(crypto.randomInt(0, lowercase.length)),
        digits.charAt(crypto.randomInt(0, digits.length)),
        specials.charAt(crypto.randomInt(0, specials.length))
    ];

    for (let i = chars.length; i < length; i++) {
        chars.push(all.charAt(crypto.randomInt(0, all.length)));
    }

    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        const temp = chars[i];
        chars[i] = chars[j];
        chars[j] = temp;
    }

    return chars.join("");
};

export function getUserByUsername(username: string): Promise<User | undefined> {
    const searchUsername = username.trim().toLowerCase();
    return query<DbUserRow>(
        "SELECT id_utilisateur, identifiant, mdpbcrypt, token_utilisateur, role FROM utilisateur WHERE LOWER(identifiant) = $1 LIMIT 1",
        [searchUsername]
    ).then(result => {
        if (result.rows.length === 0) return undefined;
        return toUser(result.rows[0]);
    });
};

export async function getUserByLogin(username: string, password: string): Promise<User | undefined> {
    const user = await getUserByUsername(username);
    if (!user) return undefined;

    const passwordMatches = await bcrypt.compare(password, user.hashedPassword);
    return passwordMatches ? user : undefined;
}

type createUserResponse = "success" | "user_exists" | "error";
interface createUserResult {
    status: createUserResponse;
    user?: User;
};
export async function createUser(username: string, password: string, role: User['role']): Promise<createUserResult> {
    if (await getUserByUsername(username)) {
        return { status: "user_exists" };
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        // Re-check to avoid race with another request creating same username in parallel.
        if (await getUserByUsername(username)) {
            return { status: "user_exists" };
        }

        const token = await generateUniqueToken(50);
        const inserted = await query<DbUserRow>(
            "INSERT INTO utilisateur (identifiant, mdpbcrypt, token_utilisateur, role) VALUES ($1, $2, $3, $4) RETURNING id_utilisateur, identifiant, mdpbcrypt, token_utilisateur, role",
            [username.trim(), hash, token, role]
        );

        const row = inserted.rows[0];
        const newUser = toUser(row);
        newUser.date_created = new Date();

        return { status: "success", user: newUser };
    } catch {
        return { status: "error" };
    }
}

export function registerClientUser(username: string, password: string): Promise<createUserResult> {
    return createUser(username, password, "client");
};

export function createBibliothecaireUser(username: string, password: string): Promise<createUserResult> {
    return createUser(username, password, "bibliothecaire");
};

type deleteUserResult = "success" | "not_found" | "error";
export function deleteUserById(id: number): Promise<deleteUserResult> {
    return query<{ id_utilisateur: number }>(
        "DELETE FROM utilisateur WHERE id_utilisateur = $1 RETURNING id_utilisateur",
        [id]
    ).then(result => {
        if (result.rows.length === 0) return "not_found";

        return "success";
    }).catch(() => "error");
};

export function getUsersByRole(role: User['role']): Promise<User[]> {
    return query<DbUserRow>(
        "SELECT id_utilisateur, identifiant, mdpbcrypt, token_utilisateur, role FROM utilisateur WHERE role = $1 ORDER BY id_utilisateur ASC",
        [role]
    ).then(result => result.rows.map(row => toUser(row)));
};