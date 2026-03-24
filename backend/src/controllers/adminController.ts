import type { Request, Response } from "express";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import type { bibliothecairesResponse, createBibliothecaireBody, createBibliothecaireResponse, deleteBibliothecaireBody } from "@shared/types/api/adminApi.js";
import { createBibliothecaireAccount, deleteBibliothecaireAccount, listBibliothecaires } from "../services/adminService.js";
import { getUsernameRulesErrors } from "@shared/utils/usernameRules.js";

export async function createBibliothecaire(req: Request<{}, createBibliothecaireResponse, createBibliothecaireBody>, res: Response<createBibliothecaireResponse>) {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({
                success: false,
                reason: "Champs invalides:\n- nom d'utilisateur requis"
            });
        }

        const usernameRulesErrors = getUsernameRulesErrors(username);
        if (usernameRulesErrors.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Nom d'utilisateur invalide:\n- ${usernameRulesErrors.join("\n- ")}`
            });
        }

        const result = await createBibliothecaireAccount(username);
        if (result.status === "user_exists") {
            return res.status(409).json({
                success: false,
                reason: "Nom d'utilisateur déjà utilisé"
            });
        }

        if (result.status !== "success") {
            return res.status(500).json({
                success: false,
                reason: "Erreur interne"
            });
        }

        return res.status(201).json({
            success: true,
            id: result.id,
            generatedPassword: result.generatedPassword
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            reason: "Erreur interne"
        });
    }
}

export async function deleteBibliothecaire(req: Request<{}, baseResponse, deleteBibliothecaireBody>, res: Response<baseResponse>) {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({
                success: false,
                reason: "Nom d'utilisateur requis"
            });
        }

        const result = await deleteBibliothecaireAccount(username);
        if (result === "not_found") {
            return res.status(404).json({
                success: false,
                reason: "Compte introuvable"
            });
        }

        if (result === "invalid_role") {
            return res.status(400).json({
                success: false,
                reason: "Ce compte n'est pas un bibliothécaire"
            });
        }

        if (result !== "success") {
            return res.status(500).json({
                success: false,
                reason: "Erreur interne"
            });
        }

        return res.status(200).json({
            success: true
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            reason: "Erreur interne"
        });
    }
}

export async function getBibliothecaires(req: Request<{}, bibliothecairesResponse>, res: Response<bibliothecairesResponse>) {
    try {
        const bibliothecaires = await listBibliothecaires();
        return res.status(200).json({
            success: true,
            bibliothecaires
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            reason: "Erreur interne"
        });
    }
}
