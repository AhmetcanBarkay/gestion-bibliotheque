import type { Request, Response } from 'express';
import type {
    changePasswordBody,
    changePasswordResponse,
    loginBody,
    loginResponse,
    registerBody,
    registerResponse,
    verifyTokenBody,
    verifyTokenResponse
} from "@shared/types/api/authApi.js";
import { changeUserPassword, getUserByLogin, registerClientUser } from '../services/userService.js';
import { getPasswordRulesErrors, isPasswordValid } from '@shared/utils/passwordRules.js';
import { getUsernameRulesErrors } from '@shared/utils/usernameRules.js';
import { API_MESSAGES } from '@shared/constants/messages.js';

export async function verifyTokenUser(req: Request<{}, verifyTokenResponse, verifyTokenBody>, res: Response<verifyTokenResponse>) {
    res.status(200).json({
        success: req.user ? true : false,
        role: req.user?.role,
        username: req.user?.username
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

        const usernameRulesErrors = getUsernameRulesErrors(username);
        if (usernameRulesErrors.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Nom d'utilisateur invalide:\n- ${usernameRulesErrors.join("\n- ")}`
            });
        }

        if (password.length > 100) {
            return res.status(400).json({
                success: false,
                reason: "Mot de passe invalide, 100 caractères maximum"
            });
        }

        const user = await getUserByLogin(username, password);
        if (!user) {
            return res.status(401).json({
                success: false,
                reason: API_MESSAGES.INVALID_CREDENTIALS
            });
        }

        res.status(200).json({
            success: true,
            token: user.token,
            role: user.role,
            username: user.username
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            reason: API_MESSAGES.INTERNAL_ERROR
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

        const usernameRulesErrors = getUsernameRulesErrors(username);
        if (usernameRulesErrors.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Nom d'utilisateur invalide:\n- ${usernameRulesErrors.join("\n- ")}`
            });
        }

        const passwordRuleErrors = getPasswordRulesErrors(password);
        if (!isPasswordValid(password) || passwordRuleErrors.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Mot de passe invalide, il vous faut :\n- ${passwordRuleErrors.join("\n- ")}`
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
                reason: API_MESSAGES.INTERNAL_ERROR
            });
        }

        return res.status(201).json({
            success: true,
            token: result.user.token,
            role: result.user.role,
            username: result.user.username
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            reason: API_MESSAGES.INTERNAL_ERROR
        });
    }
};

export async function changePasswordUser(req: Request<{}, changePasswordResponse, changePasswordBody>, res: Response<changePasswordResponse>) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, reason: API_MESSAGES.UNAUTHENTICATED });
        }

        if (req.user.role !== "client" && req.user.role !== "bibliothecaire") {
            return res.status(403).json({ success: false, reason: API_MESSAGES.ACCESS_DENIED });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                reason: "Champs invalides"
            });
        }

        const passwordRuleErrors = getPasswordRulesErrors(newPassword);
        if (!isPasswordValid(newPassword) || passwordRuleErrors.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Mot de passe invalide, il vous faut:\n- ${passwordRuleErrors.join("\n- ")}`
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                reason: "Confirmation invalide: doit être identique au nouveau mot de passe"
            });
        }

        const result = await changeUserPassword(req.user.id, currentPassword, newPassword);
        if (result.status === "not_found") {
            return res.status(404).json({ success: false, reason: API_MESSAGES.UNAUTHENTICATED });
        }
        if (result.status === "invalid_current_password") {
            return res.status(400).json({ success: false, reason: "Mot de passe actuel incorrect" });
        }
        if (result.status === "same_password") {
            return res.status(400).json({ success: false, reason: "Le nouveau mot de passe doit être différent de l'actuel" });
        }
        if (result.status === "error") {
            return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
        }

        return res.status(200).json({ success: true, token: result.token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            reason: API_MESSAGES.INTERNAL_ERROR
        });
    }
}