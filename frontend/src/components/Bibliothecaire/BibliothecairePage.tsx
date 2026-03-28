import { useEffect, useState } from "react";
import AppFooter from "../Footer/AppFooter";
import type { FooterAction } from "../Footer/AppFooter";
import CatalogSection from "./CatalogSection";
import AuteursSection from "./AuteursSection";
import EmpruntsSection from "./EmpruntsSection";
import type { Auteur, Emprunt, Exemplaire, Livre } from "./types";
import { apiHelper } from "../../api/apiHelper";
import type {
    corpsCreationAuteur,
    corpsCreationExemplaire,
    corpsCreationLivre,
    corpsMiseAJourLivre,
    corpsSuppressionAuteur,
    corpsSuppressionExemplaire,
    corpsSuppressionLivre,
    reponseAuteurs,
    reponseCatalogue,
    reponseCreationAuteur,
    reponseCreationExemplaire,
    reponseCreationLivre,
    reponseSuppressionAuteur,
    reponseSuppressionExemplaire
} from "@shared/types/api/bibliothecaireApi.js";
import "./BibliothecairePage.css";

type BibliothecaireMenuKey = "catalogue" | "auteurs" | "emprunts";
type ReponseAvecSucces = { success: boolean; reason?: string };

const MESSAGE_REPONSE_INVALIDE = "Reponse invalide du serveur";
const MESSAGE_ERREUR_INCONNUE = "Erreur inconnue";

function BibliothecairePage() {
    const [activeMenu, setActiveMenu] = useState<BibliothecaireMenuKey>("catalogue");
    const [statusMessage, setStatusMessage] = useState("");

    const [auteurs, setAuteurs] = useState<Auteur[]>([]);
    const [livres, setLivres] = useState<Livre[]>([]);
    const [exemplaires, setExemplaires] = useState<Exemplaire[]>([]);
    const [emprunts, setEmprunts] = useState<Emprunt[]>([]);

    const [livreTitreInput, setLivreTitreInput] = useState("");
    const [auteurIdsSelectionnes, setAuteurIdsSelectionnes] = useState<number[]>([]);
    const [auteurRechercheInput, setAuteurRechercheInput] = useState("");
    const [livreAuteurRechercheInput, setLivreAuteurRechercheInput] = useState("");
    const [nouvelAuteurInput, setNouvelAuteurInput] = useState("");

    const [menuLivreOuvertId, setMenuLivreOuvertId] = useState<number | null>(null);
    const [livreEnEditionId, setLivreEnEditionId] = useState<number | null>(null);
    const [editionTitreInput, setEditionTitreInput] = useState("");
    const [editionAuteurIdsSelectionnes, setEditionAuteurIdsSelectionnes] = useState<number[]>([]);
    const [editionAuteurRechercheInput, setEditionAuteurRechercheInput] = useState("");

    const actions: FooterAction<BibliothecaireMenuKey>[] = [
        { key: "catalogue", label: "Catalogue" },
        { key: "auteurs", label: "Auteurs" },
        { key: "emprunts", label: "Emprunts" }
    ];

    const lireGet = async <T extends ReponseAvecSucces>(url: string): Promise<T | null> => {
        const data = (await apiHelper.get<T>(url)).data;
        if (!data) {
            setStatusMessage(MESSAGE_REPONSE_INVALIDE);
            return null;
        }
        return data;
    };

    const lirePost = async <Req, Res extends ReponseAvecSucces>(url: string, payload: Req): Promise<Res | null> => {
        const data = (await apiHelper.post<Req, Res>(url, payload)).data;
        if (!data) {
            setStatusMessage(MESSAGE_REPONSE_INVALIDE);
            return null;
        }
        return data;
    };

    const reinitialiserEdition = () => {
        setLivreEnEditionId(null);
        setEditionTitreInput("");
        setEditionAuteurIdsSelectionnes([]);
        setEditionAuteurRechercheInput("");
    };

    const validerLivre = (titre: string, idsAuteurs: number[]): boolean => {
        if (titre.trim().length === 0) {
            setStatusMessage("Titre requis");
            return false;
        }
        if (idsAuteurs.length === 0) {
            setStatusMessage("Au moins un auteur requis");
            return false;
        }
        return true;
    };

    const chargerCatalogue = async () => {
        const data = await lireGet<reponseCatalogue>("/bibliothecaire/catalogue");
        if (!data) return;

        if (!data.success || !data.livres) {
            setStatusMessage(data?.reason || "Erreur de chargement du catalogue");
            return;
        }

        const prochainsLivres: Livre[] = data.livres.map(livre => ({
            id: livre.id,
            titre: livre.titre,
            auteurIds: livre.auteurs.map(auteur => auteur.id)
        }));

        const prochainsExemplaires: Exemplaire[] = [];
        const prochainsEmprunts: Emprunt[] = [];
        let idEmpruntSynth = 1;

        data.livres.forEach(livre => {
            livre.exemplaires.forEach(exemplaire => {
                prochainsExemplaires.push({ id: exemplaire.id, livreId: livre.id });
                if (exemplaire.estEmprunte && exemplaire.emprunteParUserId !== undefined) {
                    prochainsEmprunts.push({
                        id: idEmpruntSynth++,
                        exemplaireId: exemplaire.id,
                        userId: exemplaire.emprunteParUserId,
                        dateDebut: "",
                        dateFin: null
                    });
                }
            });
        });

        setLivres(prochainsLivres);
        setExemplaires(prochainsExemplaires);
        setEmprunts(prochainsEmprunts);
    };

    const chargerAuteurs = async () => {
        const data = await lireGet<reponseAuteurs>("/bibliothecaire/auteurs");
        if (!data) return;

        if (!data.success || !data.auteurs) {
            setStatusMessage(data?.reason || "Erreur de chargement des auteurs");
            return;
        }

        setAuteurs(data.auteurs.map(auteur => ({ id: auteur.id, nom: auteur.nom })));
    };

    useEffect(() => {
        (async () => {
            await chargerCatalogue();
            await chargerAuteurs();
        })();
    }, []);

    const toggleSelectionAuteur = (
        auteurId: number,
        setSelectedIds: (updater: (prev: number[]) => number[]) => void
    ) => {
        setSelectedIds(prev => (
            prev.includes(auteurId)
                ? prev.filter(id => id !== auteurId)
                : [...prev, auteurId]
        ));
    };

    const handleAjouterAuteur = async () => {
        setStatusMessage("");
        const nom = nouvelAuteurInput.trim();
        if (nom.length === 0) {
            setStatusMessage("Nom d'auteur requis");
            return;
        }

        const data = await lirePost<corpsCreationAuteur, reponseCreationAuteur>("/bibliothecaire/auteur/ajouter", { nom });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || MESSAGE_ERREUR_INCONNUE);
            return;
        }

        setNouvelAuteurInput("");
        await chargerAuteurs();
        setStatusMessage("Auteur ajoute");
    };

    const handleSupprimerAuteur = async (auteurId: number) => {
        setStatusMessage("");

        const firstData = await lirePost<corpsSuppressionAuteur, reponseSuppressionAuteur>("/bibliothecaire/auteur/supprimer", {
            auteurId,
            force: false
        });
        if (!firstData) return;

        if (!firstData.success && firstData.besoinConfirmation) {
            const nomAuteur = auteurs.find(auteur => auteur.id === auteurId)?.nom || `#${auteurId}`;
            const confirmed = window.confirm(
                `L'auteur ${nomAuteur} est lie a ${firstData.livresLiesCount || 0} livre(s). Supprimer l'auteur retirera ce lien dans ces livres. Continuer ?`
            );
            if (!confirmed) {
                return;
            }

            const forcedData = await lirePost<corpsSuppressionAuteur, reponseSuppressionAuteur>("/bibliothecaire/auteur/supprimer", {
                auteurId,
                force: true
            });
            if (!forcedData) return;
            if (!forcedData.success) {
                setStatusMessage(forcedData.reason || MESSAGE_ERREUR_INCONNUE);
                return;
            }
        } else if (!firstData.success) {
            setStatusMessage(firstData.reason || MESSAGE_ERREUR_INCONNUE);
            return;
        }

        await chargerCatalogue();
        await chargerAuteurs();
        setAuteurIdsSelectionnes(prev => prev.filter(id => id !== auteurId));
        setEditionAuteurIdsSelectionnes(prev => prev.filter(id => id !== auteurId));
        setStatusMessage("Auteur supprime");
    };

    const handleAjouterLivre = async () => {
        setStatusMessage("");
        const titre = livreTitreInput.trim();
        if (!validerLivre(titre, auteurIdsSelectionnes)) return;

        const data = await lirePost<corpsCreationLivre, reponseCreationLivre>("/bibliothecaire/livre/ajouter", {
            titre,
            auteurIds: auteurIdsSelectionnes
        });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || MESSAGE_ERREUR_INCONNUE);
            return;
        }

        await chargerCatalogue();
        setLivreTitreInput("");
        setAuteurIdsSelectionnes([]);
        setStatusMessage("Livre ajoute");
    };

    const handleOuvrirEdition = (livre: Livre) => {
        setMenuLivreOuvertId(null);
        setLivreEnEditionId(livre.id);
        setEditionTitreInput(livre.titre);
        setEditionAuteurIdsSelectionnes(livre.auteurIds);
        setEditionAuteurRechercheInput("");
    };

    const handleSauvegarderEdition = async () => {
        if (livreEnEditionId === null) return;

        setStatusMessage("");
        const titre = editionTitreInput.trim();
        if (!validerLivre(titre, editionAuteurIdsSelectionnes)) return;

        const data = await lirePost<corpsMiseAJourLivre, ReponseAvecSucces>("/bibliothecaire/livre/modifier", {
            id: livreEnEditionId,
            titre,
            auteurIds: editionAuteurIdsSelectionnes
        });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || MESSAGE_ERREUR_INCONNUE);
            return;
        }

        await chargerCatalogue();
        reinitialiserEdition();
        setStatusMessage("Livre modifie");
    };

    const handleSupprimerLivre = async (livreId: number) => {
        setStatusMessage("");
        const data = await lirePost<corpsSuppressionLivre, ReponseAvecSucces>("/bibliothecaire/livre/supprimer", { id: livreId });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || MESSAGE_ERREUR_INCONNUE);
            setMenuLivreOuvertId(null);
            return;
        }

        await chargerCatalogue();
        await chargerAuteurs();
        setMenuLivreOuvertId(null);
        setStatusMessage("Livre supprime");
    };

    const handleAjouterExemplaire = async (livreId: number) => {
        setStatusMessage("");
        const data = await lirePost<corpsCreationExemplaire, reponseCreationExemplaire>("/bibliothecaire/exemplaire/ajouter", { livreId });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || MESSAGE_ERREUR_INCONNUE);
            return;
        }

        await chargerCatalogue();
        setMenuLivreOuvertId(null);
        setStatusMessage("Exemplaire ajoute");
    };

    const handleSupprimerExemplaire = async (exemplaireId: number) => {
        setStatusMessage("");
        const data = await lirePost<corpsSuppressionExemplaire, reponseSuppressionExemplaire>("/bibliothecaire/exemplaire/supprimer", { exemplaireId });
        if (!data) return;

        if (!data.success) {
            if (data.emprunteParUserId !== undefined) {
                setStatusMessage(`Impossible de supprimer cet exemplaire: emprunte par l'utilisateur ${data.emprunteParUserId}`);
                return;
            }
            setStatusMessage(data.reason || MESSAGE_ERREUR_INCONNUE);
            return;
        }

        await chargerCatalogue();
        setStatusMessage("Exemplaire supprime");
    };

    const auteursFiltres = auteurs.filter(auteur =>
        auteur.nom.toLowerCase().includes(auteurRechercheInput.trim().toLowerCase())
    );

    const auteursTries = auteursFiltres
        .map(auteur => ({
            ...auteur,
            livresCount: livres.filter(livre => livre.auteurIds.includes(auteur.id)).length
        }))
        .sort((a, b) => {
            if (b.livresCount !== a.livresCount) return b.livresCount - a.livresCount;
            return a.nom.localeCompare(b.nom);
        });

    return (
        <>
            <div className="bibliothecaire-panel">
                {
                    activeMenu === "catalogue" ?
                        <CatalogSection
                            auteurs={auteurs}
                            livres={livres}
                            exemplaires={exemplaires}
                            emprunts={emprunts}
                            livreTitreInput={livreTitreInput}
                            livreAuteurRechercheInput={livreAuteurRechercheInput}
                            auteurIdsSelectionnes={auteurIdsSelectionnes}
                            menuLivreOuvertId={menuLivreOuvertId}
                            livreEnEditionId={livreEnEditionId}
                            editionTitreInput={editionTitreInput}
                            editionAuteurIdsSelectionnes={editionAuteurIdsSelectionnes}
                            editionAuteurRechercheInput={editionAuteurRechercheInput}
                            onLivreTitreChange={setLivreTitreInput}
                            onLivreAuteurRechercheChange={setLivreAuteurRechercheInput}
                            onEditionTitreChange={setEditionTitreInput}
                            onEditionAuteurRechercheChange={setEditionAuteurRechercheInput}
                            onToggleAuteurSelectionne={(auteurId) => toggleSelectionAuteur(auteurId, setAuteurIdsSelectionnes)}
                            onToggleAuteurEdition={(auteurId) => toggleSelectionAuteur(auteurId, setEditionAuteurIdsSelectionnes)}
                            onAjouterLivre={handleAjouterLivre}
                            onOuvrirEdition={handleOuvrirEdition}
                            onSauvegarderEdition={handleSauvegarderEdition}
                            onAnnulerEdition={reinitialiserEdition}
                            onToggleMenuLivre={(livreId) => {
                                setMenuLivreOuvertId(prev => prev === livreId ? null : livreId);
                            }}
                            onSupprimerLivre={handleSupprimerLivre}
                            onAjouterExemplaire={handleAjouterExemplaire}
                            onSupprimerExemplaire={handleSupprimerExemplaire}
                        /> : activeMenu === "auteurs" ?
                            <AuteursSection
                                auteurRechercheInput={auteurRechercheInput}
                                nouvelAuteurInput={nouvelAuteurInput}
                                auteursTries={auteursTries}
                                onAuteurRechercheChange={setAuteurRechercheInput}
                                onNouvelAuteurChange={setNouvelAuteurInput}
                                onAjouterAuteur={handleAjouterAuteur}
                                onSupprimerAuteur={handleSupprimerAuteur}
                            /> :
                            <EmpruntsSection />
                }

                {statusMessage.length > 0 ? <p className="bibliothecaire-status">{statusMessage}</p> : null}
            </div>
            <AppFooter
                actions={actions}
                activeKey={activeMenu}
                onSelect={(key) => {
                    setActiveMenu(key);
                    setMenuLivreOuvertId(null);
                    reinitialiserEdition();
                    setStatusMessage("");
                }}
            />
        </>
    );
}

export default BibliothecairePage;
