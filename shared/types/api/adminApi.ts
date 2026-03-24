import type { baseResponse } from "./baseApi.js";

export interface createBibliothecaireBody {
    username: string;
};

export interface createBibliothecaireResponse extends baseResponse {
    id?: number;
    generatedPassword?: string;
};

export interface deleteBibliothecaireBody {
    username: string;
};

export interface bibliothecaireItem {
    id: number;
    username: string;
    date_created: string;
};

export interface bibliothecairesResponse extends baseResponse {
    bibliothecaires?: bibliothecaireItem[];
};