import type { Request, Response } from 'express';
import type { loginBody, loginResponse, registerBody, registerResponse, verifyTokenBody } from "@shared/types/api/authApi.js";
import { getUserByLogin, registerClientUser } from '../services/userService.js';
import type { baseResponse } from '@shared/types/api/baseApi.js';

function isStrongPassword(password: string): boolean {
    const hasMinLength = password.length >= 10;
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasMinLength && hasUppercase && hasDigit && hasSpecial;
}

function getPasswordRulesErrors(password: string): string[] {
    const errors: string[] = [];
    if (password.length < 10) errors.push("10 caractères minimum");
    if (!/[A-Z]/.test(password)) errors.push("1 majuscule");
    if (!/\d/.test(password)) errors.push("1 chiffre");
    if (!/[^A-Za-z0-9]/.test(password)) errors.push("1 symbole spécial");
    return errors;
}

export async function verifyTokenUser(req: Request<{}, baseResponse, verifyTokenBody>, res: Response<baseResponse>) {
    res.status(200).json({
        success: req.user ? true : false
    });
};
export async function loginUser(req: Request<{}, loginResponse, loginBody>, res: Response<loginResponse>) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                reason: "Champs invalides"
            });
        };

        const user = await getUserByLogin(username, password);
        if (!user) {
            return res.status(401).json({
                success: false,
                reason: "Identifiants invalides"
            });
        }

        res.status(200).json({
            success: true,
            token: user.token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            reason: "Erreur interne"
        });
    };
};

export async function registerUser(req: Request<{}, registerResponse, registerBody>, res: Response<registerResponse>) {
    try {
        const { username, password, confirmPassword } = req.body;
        const inputErrors: string[] = [];
        if (!username) inputErrors.push("nom d'utilisateur requis");
        if (!password) inputErrors.push("mot de passe requis");
        if (!confirmPassword) inputErrors.push("confirmation requise");
        if (inputErrors.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Champs invalides:\n- ${inputErrors.join("\n- ")}`
            });
        };

        const passwordRuleErrors = getPasswordRulesErrors(password);
        if (!isStrongPassword(password) || passwordRuleErrors.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Mot de passe invalide:\n- ${passwordRuleErrors.join("\n- ")}`
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                reason: "Confirmation invalide: doit être identique au mot de passe"
            });
        }

        const result = await registerClientUser(username, password);
        if (result.status === "user_exists") {
            return res.status(409).json({
                success: false,
                reason: "Nom d'utilisateur déjà utilisé"
            });
        }

        if (result.status !== "success" || !result.user) {
            return res.status(500).json({
                success: false,
                reason: "Erreur interne"
            });
        }

        return res.status(201).json({
            success: true,
            token: result.user.token
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            reason: "Erreur interne"
        });
    }
};