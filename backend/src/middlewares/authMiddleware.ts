import { Request, Response, NextFunction } from 'express';
import { getUserByToken } from '../services/userService.js';
import { API_MESSAGES } from '@shared/constants/messages.js';

type RoleAutorise = 'admin' | 'bibliothecaire' | 'client';

function requireRole(...rolesAutorises: RoleAutorise[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !rolesAutorises.includes(req.user.role as RoleAutorise)) {
            return res.status(403).json({
                success: false,
                reason: API_MESSAGES.ACCESS_DENIED
            });
        }
        next();
    };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            reason: API_MESSAGES.AUTHENTICATION_REQUIRED
        });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserByToken(token);

    if (!user) {
        return res.status(401).json({
            success: false,
            reason: 'Token invalide ou expiré'
        });
    }

    // On attache l'utilisateur à la requête
    req.user = user;
    next();
}

export const requireAdmin = requireRole('admin');
export const requireBibliothecaire = requireRole('bibliothecaire', 'admin');
export const requireClient = requireRole('client');