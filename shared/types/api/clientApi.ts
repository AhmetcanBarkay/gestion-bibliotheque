import type { baseResponse } from "./baseApi.js";

export interface empruntClientItem {
    id: number;
    livreId: number;
    titreLivre: string;
    dateDebut: string;
    dateRetourPrevue: string;
    dateRetourEffectif: string | null;
}

export interface reponseEmpruntsClient extends baseResponse {
    empruntsActifs?: empruntClientItem[];
    empruntsEnRetard?: empruntClientItem[];
}

export interface livreCatalogueClientItem {
    livreId: number;
    titreLivre: string;
    auteurs: string[];
    exemplairesDisponibles: number;
}

export type problemeActuelCatalogueClient = "aucun" | "emprunts_en_retard" | "limite_emprunts_atteinte";

export interface reponseCatalogueClient extends baseResponse {
    livresDisponibles?: livreCatalogueClientItem[];
    problemeActuel?: problemeActuelCatalogueClient;
    nombreEmpruntsEnCours?: number;
    nombreEmpruntsEnRetard?: number;
}

export interface abonnementClientItem {
    statut: "aucun" | "actif" | "fini";
    codeSerie: string;
    dateFin: string | null;
}

export interface reponseAbonnementClient extends baseResponse {
    abonnement?: abonnementClientItem;
}

export interface corpsSouscriptionAbonnement {
    dureeMois: number;
}

export interface corpsExtensionAbonnement {
    dureeMois: number;
}

export interface reponseActionAbonnement extends baseResponse {
    abonnement?: abonnementClientItem;
}
