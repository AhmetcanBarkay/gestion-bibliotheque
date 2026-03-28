import type { Auteur, Emprunt } from "./types";

export function getEmpruntActifPourExemplaire(emprunts: Emprunt[], exemplaireId: number): Emprunt | undefined {
    return emprunts.find(emprunt => emprunt.exemplaireId === exemplaireId && emprunt.dateFin === null);
}

export function getNomAuteurParId(auteurs: Auteur[], auteurId: number): string | undefined {
    return auteurs.find(auteur => auteur.id === auteurId)?.nom;
}
