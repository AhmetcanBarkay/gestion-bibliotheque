import type { NextFunction, Request, Response } from 'express';

type OptionsLimitationRequetes = {
    resetMs: number;
    maxRequetes: number;
    messageErreur: string;
};

type EtatLimite = {
    nombreRequetes: number;
    reinitialisationA: number;
};

function obtenirIpClient(req: Request): string {
    return req.socket.remoteAddress || 'inconnu'
}

function limiteurRequete(options: OptionsLimitationRequetes) {
    const requetesParClient = new Map<string, EtatLimite>();

    return (req: Request, res: Response, next: NextFunction) => {
        const maintenant = Date.now();
        const cleClient = obtenirIpClient(req);
        const etatActuel = requetesParClient.get(cleClient);

        if (!etatActuel || etatActuel.reinitialisationA <= maintenant) {
            requetesParClient.set(cleClient, {
                nombreRequetes: 1,
                reinitialisationA: maintenant + options.resetMs
            });
            return next();
        }

        if (etatActuel.nombreRequetes >= options.maxRequetes) {
            return res.status(429).json({
                success: false,
                reason: options.messageErreur
            });
        }

        etatActuel.nombreRequetes += 1;
        requetesParClient.set(cleClient, etatActuel);
        return next();
    };
}

const limiteurConnexion = limiteurRequete({
    resetMs: 15 * 60 * 1000,
    maxRequetes: 10,
    messageErreur: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
});

const limiteurInscription = limiteurRequete({
    resetMs: 15 * 60 * 1000,
    maxRequetes: 20,
    messageErreur: 'Trop de créations de comptes. Réessayez dans 15 minutes.'
});

export const clientGlobalRateLimiter = limiteurRequete({
    resetMs: 15 * 60 * 1000,
    maxRequetes: 300,
    messageErreur: 'Trop de requêtes client depuis cette IP. Réessayez dans 15 minutes.'
});

export const loginRateLimiter = limiteurConnexion;
export const registerRateLimiter = limiteurInscription;