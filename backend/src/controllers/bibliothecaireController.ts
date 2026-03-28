import type { Request, Response } from "express";
import type {
    corpsCreationAuteur,
    corpsCreationExemplaire,
    corpsCreationLivre,
    corpsMiseAJourLivre,
    corpsSuppressionAuteur,
    corpsSuppressionExemplaire,
    corpsSuppressionLivre,
    reponseAuteurs,
    reponseCatalogue,
    reponseCreationAuteur,
    reponseCreationExemplaire,
    reponseCreationLivre,
    reponseSuppressionAuteur,
    reponseSuppressionExemplaire
} from "@shared/types/api/bibliothecaireApi.js";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import {
    ajouterAuteur,
    ajouterExemplaire,
    ajouterLivre,
    listerAuteurs,
    listerCatalogue,
    modifierLivre,
    supprimerAuteur,
    supprimerExemplaire,
    supprimerLivre
} from "../services/bibliothecaireService.js";

export async function obtenirCatalogue(req: Request<{}, reponseCatalogue>, res: Response<reponseCatalogue>) {
    try {
        const livres = await listerCatalogue();
        return res.status(200).json({ success: true, livres });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function obtenirAuteurs(req: Request<{}, reponseAuteurs>, res: Response<reponseAuteurs>) {
    try {
        const auteurs = await listerAuteurs();
        return res.status(200).json({ success: true, auteurs });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function ajouterAuteurControleur(req: Request<{}, reponseCreationAuteur, corpsCreationAuteur>, res: Response<reponseCreationAuteur>) {
    try {
        const { nom } = req.body;
        if (!nom || nom.trim().length === 0) {
            return res.status(400).json({ success: false, reason: "Nom d'auteur requis" });
        }

        const result = await ajouterAuteur(nom);
        if (result.status === "existe") {
            return res.status(409).json({ success: false, reason: "Auteur déjà existant" });
        }

        return res.status(201).json({ success: true, id: result.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function supprimerAuteurControleur(req: Request<{}, reponseSuppressionAuteur, corpsSuppressionAuteur>, res: Response<reponseSuppressionAuteur>) {
    try {
        const { auteurId, force } = req.body;
        if (typeof auteurId !== "number") {
            return res.status(400).json({ success: false, reason: "Identifiant auteur invalide" });
        }

        const result = await supprimerAuteur({ auteurId, force });
        if (result.status === "introuvable") {
            return res.status(404).json({ success: false, reason: "Auteur introuvable" });
        }

        if (result.status === "confirmation_requise") {
            return res.status(409).json({
                success: false,
                reason: "Auteur lié à des livres",
                livresLiesCount: result.livresLiesCount,
                besoinConfirmation: true
            });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function ajouterLivreControleur(req: Request<{}, reponseCreationLivre, corpsCreationLivre>, res: Response<reponseCreationLivre>) {
    try {
        const { titre, auteurIds } = req.body;
        if (!titre || titre.trim().length === 0) {
            return res.status(400).json({ success: false, reason: "Titre requis" });
        }
        if (!Array.isArray(auteurIds) || auteurIds.length === 0) {
            return res.status(400).json({ success: false, reason: "Au moins un auteur requis" });
        }

        const result = await ajouterLivre({ titre, auteurIds });
        if (result.status === "auteurs_invalides") {
            return res.status(400).json({ success: false, reason: "Un ou plusieurs auteurs sont invalides" });
        }

        return res.status(201).json({ success: true, id: result.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function modifierLivreControleur(req: Request<{}, baseResponse, corpsMiseAJourLivre>, res: Response<baseResponse>) {
    try {
        const { id, titre, auteurIds } = req.body;
        if (typeof id !== "number") {
            return res.status(400).json({ success: false, reason: "Identifiant livre invalide" });
        }
        if (!titre || titre.trim().length === 0) {
            return res.status(400).json({ success: false, reason: "Titre requis" });
        }
        if (!Array.isArray(auteurIds) || auteurIds.length === 0) {
            return res.status(400).json({ success: false, reason: "Au moins un auteur requis" });
        }

        const result = await modifierLivre({ id, titre, auteurIds });
        if (result === "introuvable") {
            return res.status(404).json({ success: false, reason: "Livre introuvable" });
        }
        if (result === "auteurs_invalides") {
            return res.status(400).json({ success: false, reason: "Un ou plusieurs auteurs sont invalides" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function supprimerLivreControleur(req: Request<{}, baseResponse, corpsSuppressionLivre>, res: Response<baseResponse>) {
    try {
        const { id } = req.body;
        if (typeof id !== "number") {
            return res.status(400).json({ success: false, reason: "Identifiant livre invalide" });
        }

        const result = await supprimerLivre(id);
        if (result === "introuvable") {
            return res.status(404).json({ success: false, reason: "Livre introuvable" });
        }
        if (result === "a_un_exemplaire_emprunte") {
            return res.status(409).json({ success: false, reason: "Impossible de supprimer ce livre: au moins un exemplaire est emprunté" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function ajouterExemplaireControleur(req: Request<{}, reponseCreationExemplaire, corpsCreationExemplaire>, res: Response<reponseCreationExemplaire>) {
    try {
        const { livreId } = req.body;
        if (typeof livreId !== "number") {
            return res.status(400).json({ success: false, reason: "Identifiant livre invalide" });
        }

        const result = await ajouterExemplaire({ livreId });
        if (result.status === "livre_introuvable") {
            return res.status(404).json({ success: false, reason: "Livre introuvable" });
        }

        return res.status(201).json({ success: true, id: result.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function supprimerExemplaireControleur(req: Request<{}, reponseSuppressionExemplaire, corpsSuppressionExemplaire>, res: Response<reponseSuppressionExemplaire>) {
    try {
        const { exemplaireId } = req.body;
        if (typeof exemplaireId !== "number") {
            return res.status(400).json({ success: false, reason: "Identifiant exemplaire invalide" });
        }

        const result = await supprimerExemplaire({ exemplaireId });
        if (result.status === "introuvable") {
            return res.status(404).json({ success: false, reason: "Exemplaire introuvable" });
        }

        if (result.status === "emprunte") {
            return res.status(409).json({
                success: false,
                reason: "Exemplaire emprunté, suppression impossible",
                emprunteParUserId: result.emprunteParUserId
            });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}
