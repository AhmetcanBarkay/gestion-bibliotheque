import type { Request, Response } from "express";
import type {
    corpsExtensionAbonnement,
    problemeActuelCatalogueClient,
    reponseCatalogueClient,
    corpsSouscriptionAbonnement,
    reponseAbonnementClient,
    reponseActionAbonnement,
    reponseEmpruntsClient
} from "@shared/types/api/clientApi.js";
import { API_MESSAGES } from "@shared/constants/messages.js";
import { LIMITE_MAX_EMPRUNTS_ACTIFS } from "../constants/reglesEmprunt.js";
import { listerEmpruntsClient } from "../services/bibliothecaireService.js";
import {
    etendreAbonnement,
    listerCatalogueDisponibleClient,
    obtenirAbonnementClient,
    resilierAbonnement,
    souscrireAbonnement
} from "../services/clientService.js";

const REPONSE_NON_AUTHENTIFIE = { success: false, reason: API_MESSAGES.UNAUTHENTICATED } as const;
const REPONSE_DUREE_INVALIDE = { success: false, reason: API_MESSAGES.INVALID_DURATION } as const;

export async function obtenirEmpruntsClientControleur(req: Request<{}, reponseEmpruntsClient>, res: Response<reponseEmpruntsClient>) {
    try {
        if (!req.user) return res.status(401).json(REPONSE_NON_AUTHENTIFIE);

        const data = await listerEmpruntsClient(req.user.id);
        return res.status(200).json({
            success: true,
            empruntsActifs: data.empruntsActifs,
            empruntsEnRetard: data.empruntsEnRetard
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function obtenirCatalogueDisponibleClientControleur(req: Request<{}, reponseCatalogueClient>, res: Response<reponseCatalogueClient>) {
    try {
        if (!req.user) return res.status(401).json(REPONSE_NON_AUTHENTIFIE);

        const livresDisponibles = await listerCatalogueDisponibleClient();
        const emprunts = await listerEmpruntsClient(req.user.id);
        const nombreEmpruntsEnRetard = emprunts.empruntsEnRetard.length;
        const nombreEmpruntsEnCours = emprunts.empruntsActifs.length + nombreEmpruntsEnRetard;

        let problemeActuel: problemeActuelCatalogueClient = "aucun";
        if (nombreEmpruntsEnRetard > 0) {
            problemeActuel = "emprunts_en_retard";
        } else if (nombreEmpruntsEnCours >= LIMITE_MAX_EMPRUNTS_ACTIFS) {
            problemeActuel = "limite_emprunts_atteinte";
        }

        return res.status(200).json({
            success: true,
            livresDisponibles,
            problemeActuel,
            nombreEmpruntsEnCours,
            nombreEmpruntsEnRetard
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function obtenirAbonnementClientControleur(req: Request<{}, reponseAbonnementClient>, res: Response<reponseAbonnementClient>) {
    try {
        if (!req.user) return res.status(401).json(REPONSE_NON_AUTHENTIFIE);

        const abonnement = await obtenirAbonnementClient(req.user.id);
        return res.status(200).json({ success: true, abonnement });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function souscrireAbonnementControleur(req: Request<{}, reponseActionAbonnement, corpsSouscriptionAbonnement>, res: Response<reponseActionAbonnement>) {
    try {
        if (!req.user) return res.status(401).json(REPONSE_NON_AUTHENTIFIE);

        const { dureeMois } = req.body;
        if (typeof dureeMois !== "number") {
            return res.status(400).json(REPONSE_DUREE_INVALIDE);
        }

        const result = await souscrireAbonnement(req.user.id, { dureeMois });
        if (result.status === "duree_invalide") {
            return res.status(400).json(REPONSE_DUREE_INVALIDE);
        }

        return res.status(200).json({ success: true, abonnement: result.abonnement });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function etendreAbonnementControleur(req: Request<{}, reponseActionAbonnement, corpsExtensionAbonnement>, res: Response<reponseActionAbonnement>) {
    try {
        if (!req.user) return res.status(401).json(REPONSE_NON_AUTHENTIFIE);

        const { dureeMois } = req.body;
        if (typeof dureeMois !== "number") {
            return res.status(400).json(REPONSE_DUREE_INVALIDE);
        }

        const result = await etendreAbonnement(req.user.id, { dureeMois });
        if (result.status === "duree_invalide") {
            return res.status(400).json(REPONSE_DUREE_INVALIDE);
        }
        if (result.status === "abonnement_inactif") {
            return res.status(409).json({ success: false, reason: "Aucun abonnement actif" });
        }

        return res.status(200).json({ success: true, abonnement: result.abonnement });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function resilierAbonnementControleur(req: Request<{}, reponseActionAbonnement>, res: Response<reponseActionAbonnement>) {
    try {
        if (!req.user) return res.status(401).json(REPONSE_NON_AUTHENTIFIE);

        await resilierAbonnement(req.user.id);
        return res.status(200).json({
            success: true,
            abonnement: { statut: "aucun", codeSerie: "", dateFin: null }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}
