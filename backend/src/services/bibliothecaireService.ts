import type {
    auteurItem,
    livreItem,
    corpsCreationLivre,
    corpsCreationExemplaire,
    corpsSuppressionAuteur,
    corpsSuppressionExemplaire,
    corpsMiseAJourLivre
} from "@shared/types/api/bibliothecaireApi.js";
import type Auteur from "../models/auteur.js";
import type Livre from "../models/livre.js";
import type Exemplaire from "../models/exemplaire.js";
import type Emprunt from "../models/emprunt.js";

const auteurs: Auteur[] = [
    { id: 1, nom: "Victor Hugo" },
    { id: 2, nom: "Albert Camus" }
];

const livres: Livre[] = [
    { id: 1, titre: "Les Miserables", auteurIds: [1] },
    { id: 2, titre: "L'Etranger", auteurIds: [2] }
];

const exemplaires: Exemplaire[] = [
    { id: 1, livreId: 1 },
    { id: 2, livreId: 1 },
    { id: 3, livreId: 2 }
];

const emprunts: Emprunt[] = [
    { id: 1, userId: 7, exemplaireId: 2, dateDebut: "2026-03-20", dateFin: null }
];

function getEmpruntActifByExemplaireId(exemplaireId: number): Emprunt | undefined {
    return emprunts.find(emprunt => emprunt.exemplaireId === exemplaireId && emprunt.dateFin === null);
}

function nextId(items: Array<{ id: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function listerAuteurs(): Promise<auteurItem[]> {
    const result = auteurs
        .map(auteur => ({
            id: auteur.id,
            nom: auteur.nom,
            livresCount: livres.filter(livre => livre.auteurIds.includes(auteur.id)).length
        }))
        .sort((a, b) => {
            if (b.livresCount !== a.livresCount) return b.livresCount - a.livresCount;
            return a.nom.localeCompare(b.nom);
        });

    return Promise.resolve(result);
}

export function ajouterAuteur(nom: string): Promise<{ status: "succes" | "existe"; id?: number }> {
    const trimmed = nom.trim();
    const exists = auteurs.some(auteur => auteur.nom.toLowerCase() === trimmed.toLowerCase());
    if (exists) return Promise.resolve({ status: "existe" });

    const id = nextId(auteurs);
    auteurs.push({ id, nom: trimmed });
    return Promise.resolve({ status: "succes", id });
}

export function supprimerAuteur(payload: corpsSuppressionAuteur): Promise<{ status: "succes" | "confirmation_requise" | "introuvable"; livresLiesCount?: number }> {
    const index = auteurs.findIndex(auteur => auteur.id === payload.auteurId);
    if (index === -1) return Promise.resolve({ status: "introuvable" });

    const livresLiesCount = livres.filter(livre => livre.auteurIds.includes(payload.auteurId)).length;
    if (livresLiesCount > 0 && !payload.force) {
        return Promise.resolve({ status: "confirmation_requise", livresLiesCount });
    }

    if (livresLiesCount > 0) {
        livres.forEach(livre => {
            livre.auteurIds = livre.auteurIds.filter(id => id !== payload.auteurId);
        });
    }

    auteurs.splice(index, 1);
    return Promise.resolve({ status: "succes" });
}

export function listerCatalogue(): Promise<livreItem[]> {
    const result = livres.map(livre => {
        const auteursForLivre = livre.auteurIds
            .map(auteurId => auteurs.find(auteur => auteur.id === auteurId))
            .filter((auteur): auteur is Auteur => !!auteur)
            .map(auteur => ({ id: auteur.id, nom: auteur.nom }));

        const exemplairesForLivre = exemplaires
            .filter(exemplaire => exemplaire.livreId === livre.id)
            .map(exemplaire => {
                const empruntActif = getEmpruntActifByExemplaireId(exemplaire.id);
                return {
                    id: exemplaire.id,
                    estEmprunte: !!empruntActif,
                    emprunteParUserId: empruntActif?.userId
                };
            });

        return {
            id: livre.id,
            titre: livre.titre,
            auteurs: auteursForLivre,
            exemplaires: exemplairesForLivre
        };
    });

    return Promise.resolve(result);
}

export function ajouterLivre(payload: corpsCreationLivre): Promise<{ status: "succes" | "auteurs_invalides"; id?: number }> {
    const auteursValides = payload.auteurIds.every(auteurId => auteurs.some(auteur => auteur.id === auteurId));
    if (!auteursValides) return Promise.resolve({ status: "auteurs_invalides" });

    const id = nextId(livres);
    livres.push({
        id,
        titre: payload.titre.trim(),
        auteurIds: [...new Set(payload.auteurIds)]
    });
    return Promise.resolve({ status: "succes", id });
}

export function modifierLivre(payload: corpsMiseAJourLivre): Promise<"succes" | "introuvable" | "auteurs_invalides"> {
    const livre = livres.find(item => item.id === payload.id);
    if (!livre) return Promise.resolve("introuvable");

    const auteursValides = payload.auteurIds.every(auteurId => auteurs.some(auteur => auteur.id === auteurId));
    if (!auteursValides) return Promise.resolve("auteurs_invalides");

    livre.titre = payload.titre.trim();
    livre.auteurIds = [...new Set(payload.auteurIds)];
    return Promise.resolve("succes");
}

export function supprimerLivre(id: number): Promise<"succes" | "introuvable" | "a_un_exemplaire_emprunte"> {
    const livreIndex = livres.findIndex(livre => livre.id === id);
    if (livreIndex === -1) return Promise.resolve("introuvable");

    const exemplairesLivre = exemplaires.filter(exemplaire => exemplaire.livreId === id);
    const exemplaireEmpruntee = exemplairesLivre.some(exemplaire => !!getEmpruntActifByExemplaireId(exemplaire.id));
    if (exemplaireEmpruntee) return Promise.resolve("a_un_exemplaire_emprunte");

    const relatedExemplaireIds = exemplairesLivre.map(exemplaire => exemplaire.id);

    livres.splice(livreIndex, 1);
    for (let i = exemplaires.length - 1; i >= 0; i--) {
        if (exemplaires[i].livreId === id) exemplaires.splice(i, 1);
    }
    for (let i = emprunts.length - 1; i >= 0; i--) {
        if (relatedExemplaireIds.includes(emprunts[i].exemplaireId)) emprunts.splice(i, 1);
    }

    return Promise.resolve("succes");
}

export function ajouterExemplaire(payload: corpsCreationExemplaire): Promise<{ status: "succes" | "livre_introuvable"; id?: number }> {
    const livreExiste = livres.some(livre => livre.id === payload.livreId);
    if (!livreExiste) return Promise.resolve({ status: "livre_introuvable" });

    const id = nextId(exemplaires);
    exemplaires.push({ id, livreId: payload.livreId });
    return Promise.resolve({ status: "succes", id });
}

export function supprimerExemplaire(payload: corpsSuppressionExemplaire): Promise<{ status: "succes" | "introuvable" | "emprunte"; emprunteParUserId?: number }> {
    const exemplaireIndex = exemplaires.findIndex(exemplaire => exemplaire.id === payload.exemplaireId);
    if (exemplaireIndex === -1) return Promise.resolve({ status: "introuvable" });

    const empruntActif = getEmpruntActifByExemplaireId(payload.exemplaireId);
    if (empruntActif) {
        return Promise.resolve({ status: "emprunte", emprunteParUserId: empruntActif.userId });
    }

    exemplaires.splice(exemplaireIndex, 1);
    for (let i = emprunts.length - 1; i >= 0; i--) {
        if (emprunts[i].exemplaireId === payload.exemplaireId) emprunts.splice(i, 1);
    }

    return Promise.resolve({ status: "succes" });
}
