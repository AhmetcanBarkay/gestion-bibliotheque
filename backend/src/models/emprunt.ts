interface Emprunt {
    id: number;
    userId: number;
    exemplaireId: number;
    dateDebut: string;
    dateFin: string | null;
}

export default Emprunt;
