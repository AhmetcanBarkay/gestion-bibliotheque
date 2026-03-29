import express from "express";
import {
    obtenirAbonnementClientControleur,
    obtenirCatalogueDisponibleClientControleur,
    obtenirEmpruntsClientControleur,
    souscrireAbonnementControleur,
    etendreAbonnementControleur,
    resilierAbonnementControleur
} from "../controllers/clientController.js";

const router = express.Router();

router.get("/emprunts", obtenirEmpruntsClientControleur);
router.get("/catalogue", obtenirCatalogueDisponibleClientControleur);
router.get("/abonnement", obtenirAbonnementClientControleur);
router.post("/abonnement/souscrire", souscrireAbonnementControleur);
router.post("/abonnement/etendre", etendreAbonnementControleur);
router.post("/abonnement/resilier", resilierAbonnementControleur);

export default router;
