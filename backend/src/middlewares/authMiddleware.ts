import { Request, Response, NextFunction } from 'express';
import { getUserByToken } from '../services/userService.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            reason: 'Authentification requis'
        });
    }

    const token = authHeader.split(' ')[1];
    const user = getUserByToken(token);

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

export function requireAdmin(req: Request, res: Response, next: NextFunction) {

    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            reason: 'Accès refusé'
        });
    }
    next();
};