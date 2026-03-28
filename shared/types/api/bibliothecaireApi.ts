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
}
