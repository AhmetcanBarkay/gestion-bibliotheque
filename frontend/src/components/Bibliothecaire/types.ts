export interface Auteur {
    id: number;
    nom: string;
}

export interface Livre {
    id: number;
    titre: string;
    auteurIds: number[];
}

export interface Exemplaire {
    id: number;
    livreId: number;
}

export interface Emprunt {
    id: number;
    exemplaireId: number;
    userId: number;
    dateDebut: string;
    dateFin: string | null;
}
