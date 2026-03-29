import type { baseResponse } from "./baseApi.js";

export interface auteurItem {
    id: number;
    nom: string;
    livresCount: number;
}

export interface exemplaireItem {
    id: number;
    estEmprunte: boolean;
    emprunteParUserId?: number;
    emprunteParUsername?: string;
}

export interface livreItem {
    id: number;
    titre: string;
    auteurs: Array<{ id: number; nom: string }>;
    exemplaires: exemplaireItem[];
}

export interface reponseCatalogue extends baseResponse {
    livres?: livreItem[];
}

export interface reponseAuteurs extends baseResponse {
    auteurs?: auteurItem[];
}

export interface corpsCreationAuteur {
    nom: string;
}

export interface reponseCreationAuteur extends baseResponse {
    id?: number;
}

export interface corpsModificationAuteur {
    auteurId: number;
    nom: string;
}

export interface reponseModificationAuteur extends baseResponse {
}

export interface corpsSuppressionAuteur {
    auteurId: number;
    force?: boolean;
}

export interface reponseSuppressionAuteur extends baseResponse {
    livresLiesCount?: number;
    besoinConfirmation?: boolean;
}

export interface corpsCreationLivre {
    titre: string;
    auteurIds: number[];
}

export interface reponseCreationLivre extends baseResponse {
    id?: number;
}

export interface corpsMiseAJourLivre {
    id: number;
    titre: string;
    auteurIds: number[];
}

export interface corpsSuppressionLivre {
    id: number;
}

export interface corpsCreationExemplaire {
    livreId: number;
}

export interface reponseCreationExemplaire extends baseResponse {
    id?: number;
}

export interface corpsSuppressionExemplaire {
    exemplaireId: number;
}

export interface reponseSuppressionExemplaire extends baseResponse {
    emprunteParUserId?: number;
    emprunteParUsername?: string;
}

export interface empruntBibliothecaireItem {
    id: number;
    userId: number;
    username: string;
    exemplaireId: number;
    livreId: number;
    titreLivre: string;
    dateDebut: string;
    dateRetourPrevue: string;
    dateRetourEffectif: string | null;
}

export interface reponseEmpruntsBibliothecaire extends baseResponse {
    empruntsActifs?: empruntBibliothecaireItem[];
    empruntsEnRetard?: empruntBibliothecaireItem[];
}

export interface corpsAjoutEmpruntBibliothecaire {
    codeSerieAbonnement: string;
    exemplaireId: number;
}

export interface reponseAjoutEmpruntBibliothecaire extends baseResponse {
    id?: number;
    livresEnRetard?: Array<{
        livreId: number;
        exemplaireId: number;
        titreLivre: string;
        dateRetourPrevue: string;
    }>;
}

export interface corpsConfirmationRetourEmprunt {
    empruntId: number;
}
