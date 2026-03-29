import type {
    abonnementClientItem,
    corpsExtensionAbonnement,
    corpsSouscriptionAbonnement,
    livreCatalogueClientItem
} from "@shared/types/api/clientApi.js";
import crypto from "crypto";
import { query } from "../db/postgres.js";

const DUREES_VALIDES = new Set([1, 3, 6, 12]);

interface AbonnementRow {
    code_serie: string;
    date_fin: string | Date;
}

function toDateTimeMinute(value: string | Date): string {
    if (value instanceof Date) {
        const annee = String(value.getFullYear());
        const mois = String(value.getMonth() + 1).padStart(2, "0");
        const jour = String(value.getDate()).padStart(2, "0");
        const heure = String(value.getHours()).padStart(2, "0");
        const minute = String(value.getMinutes()).padStart(2, "0");
        return `${annee}-${mois}-${jour} ${heure}:${minute}`;
    }

    return value.slice(0, 16).replace("T", " ");
}

function genererCodeSerie(): string {
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let value = "";
    for (let i = 0; i < 6; i++) {
        value += alphabet.charAt(crypto.randomInt(0, alphabet.length));
    }
    return value;
}

function validerDuree(dureeMois: number): boolean {
    return Number.isInteger(dureeMois) && DUREES_VALIDES.has(dureeMois);
}

async function genererCodeSerieUnique(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const tentative = genererCodeSerie();
        const existing = await query<{ id_abonnement: number }>(
            "SELECT id_abonnement FROM abonnement WHERE code_serie = $1 LIMIT 1",
            [tentative]
        );
        if (existing.rows.length === 0) return tentative;
    }

    throw new Error("Impossible de générer un code série unique");
}

export async function obtenirAbonnementClient(userId: number): Promise<abonnementClientItem> {
    const result = await query<AbonnementRow>(
        `SELECT code_serie, date_fin
         FROM abonnement
         WHERE id_utilisateur = $1
           AND date_fin >= CURRENT_TIMESTAMP
         LIMIT 1`,
        [userId]
    );

    if (result.rows.length === 0) {
        return { statut: "aucun", codeSerie: "", dateFin: null };
    }

    const abonnement = result.rows[0];

    return {
        statut: "actif",
        codeSerie: abonnement.code_serie,
        dateFin: toDateTimeMinute(abonnement.date_fin)
    };
}

export async function souscrireAbonnement(userId: number, payload: corpsSouscriptionAbonnement): Promise<{ status: "succes" | "duree_invalide"; abonnement?: abonnementClientItem }> {
    if (!validerDuree(payload.dureeMois)) return { status: "duree_invalide" };

    const codeSerie = await genererCodeSerieUnique();

    const writeResult = await query<AbonnementRow>(
        `INSERT INTO abonnement (id_utilisateur, code_serie, date_fin)
         VALUES ($1, $2, CURRENT_TIMESTAMP + ($3::text || ' months')::interval)
         ON CONFLICT (id_utilisateur)
         DO UPDATE SET code_serie = EXCLUDED.code_serie, date_fin = EXCLUDED.date_fin
         RETURNING code_serie, date_fin`,
        [userId, codeSerie, payload.dureeMois]
    );

    const abonnement = writeResult.rows[0];

    return {
        status: "succes",
        abonnement: {
            statut: "actif",
            codeSerie: abonnement.code_serie,
            dateFin: toDateTimeMinute(abonnement.date_fin)
        }
    };
}

export async function trouverUserIdClientActifParCodeSerie(codeSerie: string): Promise<number | undefined> {
    const cleaned = codeSerie.trim();
    if (cleaned.length === 0) return undefined;

    const result = await query<{ id_utilisateur: number }>(
        `SELECT a.id_utilisateur
         FROM abonnement a
         JOIN utilisateur u ON u.id_utilisateur = a.id_utilisateur
         WHERE a.code_serie = $1
                     AND a.date_fin >= CURRENT_TIMESTAMP
           AND u.role = 'client'
         LIMIT 1`,
        [cleaned]
    );

    return result.rows[0]?.id_utilisateur;
}

export async function etendreAbonnement(userId: number, payload: corpsExtensionAbonnement): Promise<{ status: "succes" | "duree_invalide" | "abonnement_inactif"; abonnement?: abonnementClientItem }> {
    if (!validerDuree(payload.dureeMois)) return { status: "duree_invalide" };

    const updated = await query<AbonnementRow>(
        `UPDATE abonnement
         SET date_fin = date_fin + ($2::text || ' months')::interval
         WHERE id_utilisateur = $1
           AND date_fin >= CURRENT_TIMESTAMP
         RETURNING code_serie, date_fin`,
        [userId, payload.dureeMois]
    );

    if (updated.rows.length === 0) return { status: "abonnement_inactif" };

    const abonnement = updated.rows[0];

    return {
        status: "succes",
        abonnement: {
            statut: "actif",
            codeSerie: abonnement.code_serie,
            dateFin: toDateTimeMinute(abonnement.date_fin)
        }
    };
}

export async function resilierAbonnement(userId: number): Promise<{ status: "succes" }> {
    await query("DELETE FROM abonnement WHERE id_utilisateur = $1", [userId]);
    return { status: "succes" };
}

export async function listerCatalogueDisponibleClient(): Promise<livreCatalogueClientItem[]> {
    const livresResult = await query<{ id_livre: number; titre: string; exemplaires_disponibles: number }>(
        `SELECT
            l.id_livre,
            l.titre,
            COUNT(e.id_exemplaire) FILTER (WHERE em.id_exemplaire IS NULL)::int AS exemplaires_disponibles
         FROM livre l
         LEFT JOIN exemplaire e ON e.id_livre = l.id_livre
         LEFT JOIN emprunt em ON em.id_exemplaire = e.id_exemplaire
         GROUP BY l.id_livre, l.titre
         ORDER BY l.titre ASC`
    );

    if (livresResult.rows.length === 0) {
        return [];
    }

    const livreIds = livresResult.rows.map(row => row.id_livre);
    const auteursResult = await query<{ id_livre: number; nom_auteur: string }>(
        `SELECT al.id_livre, a.nom_auteur
         FROM auteur_livre al
         JOIN auteur a ON a.id_auteur = al.id_auteur
         WHERE al.id_livre = ANY($1::int[])
         ORDER BY a.nom_auteur ASC`,
        [livreIds]
    );

    const auteursParLivre = new Map<number, string[]>();
    for (const row of auteursResult.rows) {
        const existing = auteursParLivre.get(row.id_livre) || [];
        existing.push(row.nom_auteur);
        auteursParLivre.set(row.id_livre, existing);
    }

    return livresResult.rows.map(row => ({
        livreId: row.id_livre,
        titreLivre: row.titre,
        auteurs: auteursParLivre.get(row.id_livre) || [],
        exemplairesDisponibles: row.exemplaires_disponibles
    }));
}
