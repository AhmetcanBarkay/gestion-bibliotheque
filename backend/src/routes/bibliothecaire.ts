import express from "express";
import {
    ajouterAuteurControleur,
    ajouterExemplaireControleur,
    ajouterLivreControleur,
    modifierLivreControleur,
    obtenirAuteurs,
    obtenirCatalogue,
    supprimerAuteurControleur,
    supprimerExemplaireControleur,
    supprimerLivreControleur
} from "../controllers/bibliothecaireController.js";

const router = express.Router();

router.get("/catalogue", obtenirCatalogue);
router.get("/auteurs", obtenirAuteurs);
router.post("/auteur/ajouter", ajouterAuteurControleur);
router.post("/auteur/supprimer", supprimerAuteurControleur);
router.post("/livre/ajouter", ajouterLivreControleur);
router.post("/livre/modifier", modifierLivreControleur);
router.post("/livre/supprimer", supprimerLivreControleur);
router.post("/exemplaire/ajouter", ajouterExemplaireControleur);
router.post("/exemplaire/supprimer", supprimerExemplaireControleur);

export default router;
