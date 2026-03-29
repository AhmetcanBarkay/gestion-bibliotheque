import { Pool } from "pg";
import type { QueryResultRow } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

function buildConfig() {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
        throw new Error("DATABASE_URL manquant dans .env");
    }

    return {
        connectionString,
        ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined
    };
}

export const pool = new Pool(buildConfig());

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<{ rows: T[] }> {
    return pool.query<T>(text, params);
}
