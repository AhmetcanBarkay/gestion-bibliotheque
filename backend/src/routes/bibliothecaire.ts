import express from "express";
import {
    ajouterEmpruntControleur,
    ajouterAuteurControleur,
    ajouterExemplaireControleur,
    ajouterLivreControleur,
    confirmerRetourEmpruntControleur,
    modifierAuteurControleur,
    modifierLivreControleur,
    obtenirAuteurs,
    obtenirCatalogue,
    obtenirEmpruntsControleur,
    supprimerAuteurControleur,
    supprimerExemplaireControleur,
    supprimerLivreControleur
} from "../controllers/bibliothecaireController.js";

const router = express.Router();

router.get("/catalogue", obtenirCatalogue);
router.get("/auteurs", obtenirAuteurs);
router.post("/auteur/ajouter", ajouterAuteurControleur);
router.post("/auteur/modifier", modifierAuteurControleur);
router.post("/auteur/supprimer", supprimerAuteurControleur);
router.post("/livre/ajouter", ajouterLivreControleur);
router.post("/livre/modifier", modifierLivreControleur);
router.post("/livre/supprimer", supprimerLivreControleur);
router.post("/exemplaire/ajouter", ajouterExemplaireControleur);
router.post("/exemplaire/supprimer", supprimerExemplaireControleur);
router.get("/emprunts", obtenirEmpruntsControleur);
router.post("/emprunt/ajouter", ajouterEmpruntControleur);
router.post("/emprunt/retour", confirmerRetourEmpruntControleur);

export default router;
