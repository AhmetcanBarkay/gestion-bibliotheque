import type { Request, Response } from 'express';
import type { loginBody, loginResponse, verifyTokenBody } from "@shared/types/api/authApi.js";
import { getUserByLogin, getUserByToken } from '../services/userService.js';
import { baseResponse } from '@shared/types/api/baseApi.js';

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