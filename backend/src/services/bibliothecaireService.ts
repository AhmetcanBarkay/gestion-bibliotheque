import type {
    auteurItem,
    corpsAjoutEmpruntBibliothecaire,
    livreItem,
    empruntBibliothecaireItem,
    corpsCreationLivre,
    corpsCreationExemplaire,
    corpsSuppressionAuteur,
    corpsSuppressionExemplaire,
    corpsMiseAJourLivre
} from "@shared/types/api/bibliothecaireApi.js";
import type { empruntClientItem } from "@shared/types/api/clientApi.js";
import { LIMITE_MAX_EMPRUNTS_ACTIFS } from "../constants/reglesEmprunt.js";
import { query } from "../db/postgres.js";
import { trouverUserIdClientActifParCodeSerie } from "./clientService.js";

function toDateTimeMinute(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().slice(0, 16).replace("T", " ");
}

function estEmpruntEnRetard(dateRetourPrevueIso: string): boolean {
    return new Date() > new Date(dateRetourPrevueIso);
}

interface EmpruntClientActifRow {
    id_exemplaire: number;
    id_livre: number;
    titre: string;
    date_retour_effectif: string | Date;
}

type AjouterEmpruntBibliothecaireResult = {
    status:
    | "succes"
    | "abonnement_invalide"
    | "livre_introuvable"
    | "aucun_exemplaire_disponible"
    | "limite_emprunts_atteinte"
    | "deja_un_emprunt_du_livre"
    | "emprunts_en_retard";
    livresEnRetard?: Array<{
        livreId: number;
        titreLivre: string;
        dateRetourPrevue: string;
    }>;
};

function mapEmpruntFromDb(row: {
    id_exemplaire: number;
    id_utilisateur: number;
    identifiant: string;
    id_livre: number;
    titre: string;
    date_debut: string | Date;
    date_retour_effectif: string | Date;
}): empruntBibliothecaireItem {
    const dateDebut = toDateTimeMinute(row.date_debut);
    const dateRetourPrevue = toDateTimeMinute(row.date_retour_effectif);

    return {
        id: row.id_exemplaire,
        userId: row.id_utilisateur,
        username: row.identifiant,
        livreId: row.id_livre,
        titreLivre: row.titre,
        dateDebut,
        dateRetourPrevue,
        dateRetourEffectif: null
    };
}

export async function listerAuteurs(): Promise<auteurItem[]> {
    const result = await query<auteurItem>(
        `SELECT
            a.id_auteur AS id,
            a.nom_auteur AS nom,
            COUNT(al.id_livre)::int AS "livresCount"
         FROM auteur a
         LEFT JOIN auteur_livre al ON al.id_auteur = a.id_auteur
         GROUP BY a.id_auteur, a.nom_auteur
         ORDER BY "livresCount" DESC, a.nom_auteur ASC`
    );

    return result.rows;
}

export async function ajouterAuteur(nom: string): Promise<{ status: "succes" | "existe"; id?: number }> {
    const trimmed = nom.trim();
    const existing = await query<{ id_auteur: number }>(
        "SELECT id_auteur FROM auteur WHERE LOWER(nom_auteur) = LOWER($1) LIMIT 1",
        [trimmed]
    );
    if (existing.rows.length > 0) return { status: "existe" };

    const inserted = await query<{ id_auteur: number }>(
        "INSERT INTO auteur (nom_auteur) VALUES ($1) RETURNING id_auteur",
        [trimmed]
    );

    return { status: "succes", id: inserted.rows[0].id_auteur };
}

export async function modifierAuteur(payload: { auteurId: number; nom: string }): Promise<"succes" | "introuvable" | "existe"> {
    const existing = await query<{ id_auteur: number }>(
        "SELECT id_auteur FROM auteur WHERE id_auteur = $1 LIMIT 1",
        [payload.auteurId]
    );
    if (existing.rows.length === 0) return "introuvable";

    const trimmed = payload.nom.trim();
    const duplicate = await query<{ id_auteur: number }>(
        "SELECT id_auteur FROM auteur WHERE LOWER(nom_auteur) = LOWER($1) AND id_auteur <> $2 LIMIT 1",
        [trimmed, payload.auteurId]
    );
    if (duplicate.rows.length > 0) return "existe";

    await query(
        "UPDATE auteur SET nom_auteur = $1 WHERE id_auteur = $2",
        [trimmed, payload.auteurId]
    );

    return "succes";
}

export async function supprimerAuteur(payload: corpsSuppressionAuteur): Promise<{ status: "succes" | "confirmation_requise" | "introuvable"; livresLiesCount?: number }> {
    const existing = await query<{ id_auteur: number }>(
        "SELECT id_auteur FROM auteur WHERE id_auteur = $1 LIMIT 1",
        [payload.auteurId]
    );
    if (existing.rows.length === 0) return { status: "introuvable" };

    const links = await query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM auteur_livre WHERE id_auteur = $1",
        [payload.auteurId]
    );
    const livresLiesCount = Number(links.rows[0]?.count || "0");
    if (livresLiesCount > 0 && !payload.force) {
        return { status: "confirmation_requise", livresLiesCount };
    }

    await query("DELETE FROM auteur WHERE id_auteur = $1", [payload.auteurId]);
    return { status: "succes" };
}

export async function listerCatalogue(): Promise<livreItem[]> {
    const livresResult = await query<{ id_livre: number; titre: string }>(
        "SELECT id_livre, titre FROM livre ORDER BY id_livre ASC"
    );

    const auteursResult = await query<{ id_livre: number; id_auteur: number; nom_auteur: string }>(
        `SELECT al.id_livre, a.id_auteur, a.nom_auteur
         FROM auteur_livre al
         JOIN auteur a ON a.id_auteur = al.id_auteur`
    );

    const exemplairesResult = await query<{
        id_exemplaire: number;
        id_livre: number;
        emprunte_par: number | null;
        emprunte_par_username: string | null;
    }>(
        `SELECT
            e.id_exemplaire,
            e.id_livre,
            em.id_utilisateur AS emprunte_par,
            u.identifiant AS emprunte_par_username
         FROM exemplaire e
         LEFT JOIN emprunt em
                    ON em.id_exemplaire = e.id_exemplaire
         LEFT JOIN utilisateur u
                    ON u.id_utilisateur = em.id_utilisateur`
    );

    const auteursParLivre = new Map<number, Array<{ id: number; nom: string }>>();
    for (const row of auteursResult.rows) {
        const current = auteursParLivre.get(row.id_livre) || [];
        current.push({ id: row.id_auteur, nom: row.nom_auteur });
        auteursParLivre.set(row.id_livre, current);
    }

    const exemplairesParLivre = new Map<number, livreItem["exemplaires"]>();
    for (const row of exemplairesResult.rows) {
        const current = exemplairesParLivre.get(row.id_livre) || [];
        current.push({
            id: row.id_exemplaire,
            estEmprunte: row.emprunte_par !== null,
            emprunteParUserId: row.emprunte_par || undefined,
            emprunteParUsername: row.emprunte_par_username || undefined
        });
        exemplairesParLivre.set(row.id_livre, current);
    }

    return livresResult.rows.map(livre => ({
        id: livre.id_livre,
        titre: livre.titre,
        auteurs: auteursParLivre.get(livre.id_livre) || [],
        exemplaires: exemplairesParLivre.get(livre.id_livre) || []
    }));
}

export async function ajouterLivre(payload: corpsCreationLivre): Promise<{ status: "succes" | "auteurs_invalides"; id?: number }> {
    const auteurIds = [...new Set(payload.auteurIds)];
    const auteursValidesResult = await query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM auteur WHERE id_auteur = ANY($1::int[])",
        [auteurIds]
    );
    if (Number(auteursValidesResult.rows[0]?.count || "0") !== auteurIds.length) {
        return { status: "auteurs_invalides" };
    }

    const inserted = await query<{ id_livre: number }>(
        "INSERT INTO livre (titre) VALUES ($1) RETURNING id_livre",
        [payload.titre.trim()]
    );
    const livreId = inserted.rows[0].id_livre;

    for (const auteurId of auteurIds) {
        await query(
            "INSERT INTO auteur_livre (id_auteur, id_livre) VALUES ($1, $2)",
            [auteurId, livreId]
        );
    }

    // Crée automatiquement un exemplaire par défaut pour le nouveau livre.
    const ajoutExemplaireResult = await ajouterExemplaire({ livreId });
    if (ajoutExemplaireResult.status !== "succes") {
        throw new Error("Impossible de créer l'exemplaire par défaut du livre");
    }

    return { status: "succes", id: livreId };
}

export async function modifierLivre(payload: corpsMiseAJourLivre): Promise<"succes" | "introuvable" | "auteurs_invalides"> {
    const livreResult = await query<{ id_livre: number }>(
        "SELECT id_livre FROM livre WHERE id_livre = $1 LIMIT 1",
        [payload.id]
    );
    if (livreResult.rows.length === 0) return "introuvable";

    const auteurIds = [...new Set(payload.auteurIds)];
    const auteursValidesResult = await query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM auteur WHERE id_auteur = ANY($1::int[])",
        [auteurIds]
    );
    if (Number(auteursValidesResult.rows[0]?.count || "0") !== auteurIds.length) {
        return "auteurs_invalides";
    }

    await query("UPDATE livre SET titre = $1 WHERE id_livre = $2", [payload.titre.trim(), payload.id]);
    await query("DELETE FROM auteur_livre WHERE id_livre = $1", [payload.id]);
    for (const auteurId of auteurIds) {
        await query(
            "INSERT INTO auteur_livre (id_auteur, id_livre) VALUES ($1, $2)",
            [auteurId, payload.id]
        );
    }

    return "succes";
}

export async function supprimerLivre(id: number): Promise<"succes" | "introuvable" | "a_un_exemplaire_emprunte"> {
    const livreResult = await query<{ id_livre: number }>(
        "SELECT id_livre FROM livre WHERE id_livre = $1 LIMIT 1",
        [id]
    );
    if (livreResult.rows.length === 0) return "introuvable";

    const empruntActifResult = await query<{ id_exemplaire: number }>(
        `SELECT e.id_exemplaire
         FROM exemplaire e
         JOIN emprunt em ON em.id_exemplaire = e.id_exemplaire
         WHERE e.id_livre = $1
         LIMIT 1`,
        [id]
    );
    if (empruntActifResult.rows.length > 0) return "a_un_exemplaire_emprunte";

    await query("DELETE FROM livre WHERE id_livre = $1", [id]);
    return "succes";
}

export async function ajouterExemplaire(payload: corpsCreationExemplaire): Promise<{ status: "succes" | "livre_introuvable"; id?: number }> {
    const livreExisteResult = await query<{ id_livre: number }>(
        "SELECT id_livre FROM livre WHERE id_livre = $1 LIMIT 1",
        [payload.livreId]
    );
    if (livreExisteResult.rows.length === 0) return { status: "livre_introuvable" };

    const inserted = await query<{ id_exemplaire: number }>(
        "INSERT INTO exemplaire (id_livre) VALUES ($1) RETURNING id_exemplaire",
        [payload.livreId]
    );

    return { status: "succes", id: inserted.rows[0].id_exemplaire };
}

export async function supprimerExemplaire(payload: corpsSuppressionExemplaire): Promise<{ status: "succes" | "introuvable" | "emprunte"; emprunteParUserId?: number; emprunteParUsername?: string }> {
    const exemplaireResult = await query<{ id_exemplaire: number }>(
        "SELECT id_exemplaire FROM exemplaire WHERE id_exemplaire = $1 LIMIT 1",
        [payload.exemplaireId]
    );
    if (exemplaireResult.rows.length === 0) return { status: "introuvable" };

    const empruntActif = await query<{ id_utilisateur: number; identifiant: string }>(
        `SELECT em.id_utilisateur, u.identifiant
         FROM emprunt em
         JOIN utilisateur u ON u.id_utilisateur = em.id_utilisateur
         WHERE em.id_exemplaire = $1
         LIMIT 1`,
        [payload.exemplaireId]
    );
    if (empruntActif.rows.length > 0) {
        return {
            status: "emprunte",
            emprunteParUserId: empruntActif.rows[0].id_utilisateur,
            emprunteParUsername: empruntActif.rows[0].identifiant
        };
    }

    await query("DELETE FROM exemplaire WHERE id_exemplaire = $1", [payload.exemplaireId]);
    return { status: "succes" };
}

export async function listerEmpruntsBibliothecaire(): Promise<{ empruntsActifs: empruntBibliothecaireItem[]; empruntsEnRetard: empruntBibliothecaireItem[] }> {
    const result = await query<{
        id_exemplaire: number;
        id_utilisateur: number;
        identifiant: string;
        id_livre: number;
        titre: string;
        date_debut: string | Date;
        date_retour_effectif: string | Date;
    }>(
        `SELECT
            em.id_exemplaire,
            em.id_utilisateur,
            u.identifiant,
            l.id_livre,
            l.titre,
            em.date_debut,
            em.date_retour_effectif
         FROM emprunt em
         JOIN utilisateur u ON u.id_utilisateur = em.id_utilisateur
         JOIN exemplaire e ON e.id_exemplaire = em.id_exemplaire
         JOIN livre l ON l.id_livre = e.id_livre
         ORDER BY em.date_debut ASC`
    );

    const mapped = result.rows.map(mapEmpruntFromDb);

    const empruntsEnRetard = mapped.filter(item => estEmpruntEnRetard(item.dateRetourPrevue));
    const empruntsActifs = mapped.filter(item => !estEmpruntEnRetard(item.dateRetourPrevue));

    return { empruntsActifs, empruntsEnRetard };
}

export async function listerEmpruntsClient(userId: number): Promise<{ empruntsActifs: empruntClientItem[]; empruntsEnRetard: empruntClientItem[] }> {
    const result = await query<{
        id_exemplaire: number;
        id_livre: number;
        titre: string;
        date_debut: string | Date;
        date_retour_effectif: string | Date;
    }>(
        `SELECT
            em.id_exemplaire,
            l.id_livre,
            l.titre,
            em.date_debut,
            em.date_retour_effectif
         FROM emprunt em
         JOIN exemplaire e ON e.id_exemplaire = em.id_exemplaire
         JOIN livre l ON l.id_livre = e.id_livre
         WHERE em.id_utilisateur = $1
         ORDER BY em.date_debut ASC`,
        [userId]
    );

    const mapped: empruntClientItem[] = result.rows.map(row => {
        const dateDebut = toDateTimeMinute(row.date_debut);
        const dateRetourPrevue = toDateTimeMinute(row.date_retour_effectif);
        return {
            id: row.id_exemplaire,
            livreId: row.id_livre,
            titreLivre: row.titre,
            dateDebut,
            dateRetourPrevue,
            dateRetourEffectif: null
        };
    });

    const empruntsEnRetard = mapped.filter(item => estEmpruntEnRetard(item.dateRetourPrevue));
    const empruntsActifs = mapped.filter(item => !estEmpruntEnRetard(item.dateRetourPrevue));

    return { empruntsActifs, empruntsEnRetard };
}

export async function ajouterEmpruntBibliothecaire(payload: corpsAjoutEmpruntBibliothecaire): Promise<AjouterEmpruntBibliothecaireResult> {
    const userId = await trouverUserIdClientActifParCodeSerie(payload.codeSerieAbonnement);
    if (!userId) return { status: "abonnement_invalide" };

    const livre = await query<{ id_livre: number; titre: string }>(
        `SELECT id_livre, titre
         FROM livre
         WHERE id_livre = $1
         LIMIT 1`,
        [payload.livreId]
    );
    if (livre.rows.length === 0) return { status: "livre_introuvable" };

    const empruntsActifsClient = await query<EmpruntClientActifRow>(
        `SELECT
            em.id_exemplaire,
            e.id_livre,
            l.titre,
            em.date_retour_effectif
         FROM emprunt em
         JOIN exemplaire e ON e.id_exemplaire = em.id_exemplaire
         JOIN livre l ON l.id_livre = e.id_livre
         WHERE em.id_utilisateur = $1`,
        [userId]
    );

    const livresEnRetard = empruntsActifsClient.rows
        .filter(row => estEmpruntEnRetard(toDateTimeMinute(row.date_retour_effectif)))
        .map(row => ({
            livreId: row.id_livre,
            titreLivre: row.titre,
            dateRetourPrevue: toDateTimeMinute(row.date_retour_effectif)
        }));

    if (livresEnRetard.length > 0) {
        return {
            status: "emprunts_en_retard",
            livresEnRetard
        };
    }

    const empruntsActifsCount = empruntsActifsClient.rows.length;
    if (empruntsActifsCount >= LIMITE_MAX_EMPRUNTS_ACTIFS) {
        return {
            status: "limite_emprunts_atteinte"
        };
    }

    const livreId = payload.livreId;
    const emprunteDejaCeLivre = empruntsActifsClient.rows.some(row => row.id_livre === livreId);
    if (emprunteDejaCeLivre) {
        return {
            status: "deja_un_emprunt_du_livre"
        };
    }

    const exemplaireDisponible = await query<{ id_exemplaire: number }>(
        `SELECT e.id_exemplaire
         FROM exemplaire e
         LEFT JOIN emprunt em ON em.id_exemplaire = e.id_exemplaire
         WHERE e.id_livre = $1
           AND em.id_exemplaire IS NULL
         ORDER BY e.id_exemplaire ASC
         LIMIT 1`,
        [livreId]
    );

    if (exemplaireDisponible.rows.length === 0) {
        return { status: "aucun_exemplaire_disponible" };
    }

    const exemplaireDisponibleId = exemplaireDisponible.rows[0].id_exemplaire;

    const inserted = await query<{ id_exemplaire: number }>(
        `INSERT INTO emprunt (id_utilisateur, id_exemplaire, date_debut, date_retour_effectif)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days')
         ON CONFLICT (id_exemplaire) DO NOTHING
         RETURNING id_exemplaire`,
        [userId, exemplaireDisponibleId]
    );

    if (inserted.rows.length === 0) return { status: "aucun_exemplaire_disponible" };

    return { status: "succes" };
}

export async function confirmerRetourEmprunt(empruntId: number): Promise<"succes" | "introuvable"> {
    const emprunt = await query<{ id_exemplaire: number }>(
        "SELECT id_exemplaire FROM emprunt WHERE id_exemplaire = $1 LIMIT 1",
        [empruntId]
    );
    if (emprunt.rows.length === 0) return "introuvable";

    await query(
        "DELETE FROM emprunt WHERE id_exemplaire = $1",
        [empruntId]
    );
    return "succes";
}
