import { useEffect, useState } from "react";
import CatalogSection from "./CatalogSection";
import AuteursSection from "./AuteursSection";
import EmpruntsSection from "./EmpruntsSection";
import type { Auteur, Emprunt, Exemplaire, Livre } from "./types";
import { createApiReader } from "../../api/apiRequest.js";
import { API_MESSAGES } from "@shared/constants/messages.js";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import type {
    corpsAjoutEmpruntBibliothecaire,
    corpsConfirmationRetourEmprunt,
    corpsCreationAuteur,
    corpsCreationExemplaire,
    corpsCreationLivre,
    corpsModificationAuteur,
    corpsMiseAJourLivre,
    corpsSuppressionAuteur,
    corpsSuppressionExemplaire,
    corpsSuppressionLivre,
    reponseAuteurs,
    reponseCatalogue,
    reponseCreationAuteur,
    reponseCreationExemplaire,
    reponseCreationLivre,
    reponseModificationAuteur,
    reponseAjoutEmpruntBibliothecaire,
    reponseEmpruntsBibliothecaire,
    reponseSuppressionAuteur,
    reponseSuppressionExemplaire
} from "@shared/types/api/bibliothecaireApi.js";
import "./BibliothecairePage.css";

export type BibliothecaireMenuKey = "catalogue" | "auteurs" | "emprunts";

interface BibliothecairePageProps {
    activeMenu: BibliothecaireMenuKey;
    onMenuChange: (key: BibliothecaireMenuKey) => void;
}

function BibliothecairePage({ activeMenu, onMenuChange }: BibliothecairePageProps) {
    const [statusMessage, setStatusMessage] = useState("");

    const [auteurs, setAuteurs] = useState<Auteur[]>([]);
    const [livres, setLivres] = useState<Livre[]>([]);
    const [exemplaires, setExemplaires] = useState<Exemplaire[]>([]);
    const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
    const [empruntsActifsBib, setEmpruntsActifsBib] = useState<reponseEmpruntsBibliothecaire["empruntsActifs"]>([]);
    const [empruntsRetardBib, setEmpruntsRetardBib] = useState<reponseEmpruntsBibliothecaire["empruntsEnRetard"]>([]);

    const [livreTitreInput, setLivreTitreInput] = useState("");
    const [auteurIdsSelectionnes, setAuteurIdsSelectionnes] = useState<number[]>([]);
    const [auteurRechercheInput, setAuteurRechercheInput] = useState("");
    const [livreAuteurRechercheInput, setLivreAuteurRechercheInput] = useState("");
    const [nouvelAuteurInput, setNouvelAuteurInput] = useState("");
    const [auteurEnEditionId, setAuteurEnEditionId] = useState<number | null>(null);
    const [nomAuteurEditionInput, setNomAuteurEditionInput] = useState("");

    const [menuLivreOuvertId, setMenuLivreOuvertId] = useState<number | null>(null);
    const [livreEnEditionId, setLivreEnEditionId] = useState<number | null>(null);
    const [editionTitreInput, setEditionTitreInput] = useState("");
    const [editionAuteurIdsSelectionnes, setEditionAuteurIdsSelectionnes] = useState<number[]>([]);
    const [editionAuteurRechercheInput, setEditionAuteurRechercheInput] = useState("");
    const [livreEmpruntSelectionneId, setLivreEmpruntSelectionneId] = useState<number | null>(null);
    const [codeSerieAbonnementInput, setCodeSerieAbonnementInput] = useState("");

    const { lireGet, lirePost } = createApiReader(setStatusMessage);

    const reinitialiserEdition = () => {
        setLivreEnEditionId(null);
        setEditionTitreInput("");
        setEditionAuteurIdsSelectionnes([]);
        setEditionAuteurRechercheInput("");
    };

    useEffect(() => {
        setMenuLivreOuvertId(null);
        reinitialiserEdition();
        setStatusMessage("");
    }, [activeMenu]);

    const validerLivre = (titre: string): boolean => {
        if (titre.trim().length === 0) {
            setStatusMessage("Titre requis");
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
                        username: exemplaire.emprunteParUsername,
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

    const chargerEmpruntsBibliothecaire = async () => {
        const data = await lireGet<reponseEmpruntsBibliothecaire>("/bibliothecaire/emprunts");
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || "Erreur de chargement des emprunts");
            return;
        }

        setEmpruntsActifsBib(data.empruntsActifs || []);
        setEmpruntsRetardBib(data.empruntsEnRetard || []);
    };

    useEffect(() => {
        (async () => {
            await chargerCatalogue();
            await chargerAuteurs();
            await chargerEmpruntsBibliothecaire();
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
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        setNouvelAuteurInput("");
        await chargerAuteurs();
        setStatusMessage("Auteur ajouté");
    };

    const handleOuvrirEditionAuteur = (auteur: Auteur) => {
        setAuteurEnEditionId(auteur.id);
        setNomAuteurEditionInput(auteur.nom);
        setStatusMessage("");
    };

    const handleAnnulerEditionAuteur = () => {
        setAuteurEnEditionId(null);
        setNomAuteurEditionInput("");
        setStatusMessage("");
    };

    const handleModifierAuteur = async () => {
        if (auteurEnEditionId === null) return;

        setStatusMessage("");
        const nom = nomAuteurEditionInput.trim();
        if (nom.length === 0) {
            setStatusMessage("Nom d'auteur requis");
            return;
        }

        const data = await lirePost<corpsModificationAuteur, reponseModificationAuteur>("/bibliothecaire/auteur/modifier", {
            auteurId: auteurEnEditionId,
            nom
        });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        await chargerAuteurs();
        await chargerCatalogue();
        handleAnnulerEditionAuteur();
        setStatusMessage("Auteur modifié");
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
                `L'auteur ${nomAuteur} est lié à ${firstData.livresLiesCount || 0} livre(s). Supprimer l'auteur retirera ce lien dans ces livres. Continuer ?`
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
                setStatusMessage(forcedData.reason || API_MESSAGES.UNKNOWN_ERROR);
                return;
            }
        } else if (!firstData.success) {
            setStatusMessage(firstData.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        await chargerCatalogue();
        await chargerAuteurs();
        setAuteurIdsSelectionnes(prev => prev.filter(id => id !== auteurId));
        setEditionAuteurIdsSelectionnes(prev => prev.filter(id => id !== auteurId));
        if (auteurEnEditionId === auteurId) {
            handleAnnulerEditionAuteur();
        }
        setStatusMessage("Auteur supprimé");
    };

    const handleAjouterLivre = async () => {
        setStatusMessage("");
        const titre = livreTitreInput.trim();
        if (!validerLivre(titre)) return;

        const data = await lirePost<corpsCreationLivre, reponseCreationLivre>("/bibliothecaire/livre/ajouter", {
            titre,
            auteurIds: auteurIdsSelectionnes
        });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        await chargerCatalogue();
        setLivreTitreInput("");
        setAuteurIdsSelectionnes([]);
        setStatusMessage("Livre ajouté");
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
        if (!validerLivre(titre)) return;

        const data = await lirePost<corpsMiseAJourLivre, baseResponse>("/bibliothecaire/livre/modifier", {
            id: livreEnEditionId,
            titre,
            auteurIds: editionAuteurIdsSelectionnes
        });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        await chargerCatalogue();
        reinitialiserEdition();
        setStatusMessage("Livre modifié");
    };

    const handleSupprimerLivre = async (livreId: number) => {
        setStatusMessage("");
        const data = await lirePost<corpsSuppressionLivre, baseResponse>("/bibliothecaire/livre/supprimer", { id: livreId });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            setMenuLivreOuvertId(null);
            return;
        }

        await chargerCatalogue();
        await chargerAuteurs();
        setMenuLivreOuvertId(null);
        setStatusMessage("Livre supprimé");
    };

    const handleAjouterExemplaire = async (livreId: number) => {
        setStatusMessage("");
        const data = await lirePost<corpsCreationExemplaire, reponseCreationExemplaire>("/bibliothecaire/exemplaire/ajouter", { livreId });
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        await chargerCatalogue();
        setMenuLivreOuvertId(null);
        setStatusMessage("Exemplaire ajouté");
    };

    const handleSupprimerExemplaire = async (exemplaireId: number) => {
        setStatusMessage("");
        const data = await lirePost<corpsSuppressionExemplaire, reponseSuppressionExemplaire>("/bibliothecaire/exemplaire/supprimer", { exemplaireId });
        if (!data) return;

        if (!data.success) {
            if (data.emprunteParUserId !== undefined) {
                setStatusMessage(`Impossible de supprimer cet exemplaire : emprunté par utilisateur ${data.emprunteParUsername || "inconnu"}`);
                return;
            }
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        await chargerCatalogue();
        setStatusMessage("Exemplaire supprimé");
    };

    const handleAjouterEmprunt = async () => {
        setStatusMessage("");
        if (!livreEmpruntSelectionneId || codeSerieAbonnementInput.trim().length === 0) {
            setStatusMessage("Livre et code série requis");
            return;
        }

        const data = await lirePost<corpsAjoutEmpruntBibliothecaire, reponseAjoutEmpruntBibliothecaire>(
            "/bibliothecaire/emprunt/ajouter",
            { codeSerieAbonnement: codeSerieAbonnementInput.trim(), livreId: livreEmpruntSelectionneId }
        );
        if (!data) return;

        if (!data.success) {
            if (data.livresEnRetard && data.livresEnRetard.length > 0) {
                const details = data.livresEnRetard
                    .map(livre => `- ${livre.titreLivre} (retour prévu ${livre.dateRetourPrevue})`)
                    .join("\n");
                setStatusMessage(`${data.reason || API_MESSAGES.UNKNOWN_ERROR}\n${details}`);
                return;
            }

            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        setCodeSerieAbonnementInput("");
        setLivreEmpruntSelectionneId(null);
        await chargerCatalogue();
        await chargerEmpruntsBibliothecaire();
        setStatusMessage("Emprunt ajouté");
    };

    const handleConfirmerRetourEmprunt = async (empruntId: number) => {
        setStatusMessage("");
        const data = await lirePost<corpsConfirmationRetourEmprunt, baseResponse>(
            "/bibliothecaire/emprunt/retour",
            { empruntId }
        );
        if (!data) return;

        if (!data.success) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        await chargerCatalogue();
        await chargerEmpruntsBibliothecaire();
        setStatusMessage("Retour confirmé");
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

    const exemplaireIdsEmpruntes = new Set(emprunts.map(emprunt => emprunt.exemplaireId));
    const livresDisponiblesPourEmprunt = livres.map(livre => ({
        id: livre.id,
        titre: livre.titre,
        hasExemplaireDisponible: exemplaires.some(
            exemplaire => exemplaire.livreId === livre.id && !exemplaireIdsEmpruntes.has(exemplaire.id)
        )
    }));

    return (
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
                        onOuvrirAuteursRaccourci={() => {
                            onMenuChange("auteurs");
                            setMenuLivreOuvertId(null);
                            reinitialiserEdition();
                            setStatusMessage("");
                        }}
                    /> : activeMenu === "auteurs" ?
                        <AuteursSection
                            auteurRechercheInput={auteurRechercheInput}
                            nouvelAuteurInput={nouvelAuteurInput}
                            auteurEnEditionId={auteurEnEditionId}
                            nomAuteurEditionInput={nomAuteurEditionInput}
                            auteursTries={auteursTries}
                            onAuteurRechercheChange={setAuteurRechercheInput}
                            onNouvelAuteurChange={setNouvelAuteurInput}
                            onAuteurEnEditionNomChange={setNomAuteurEditionInput}
                            onOuvrirEditionAuteur={handleOuvrirEditionAuteur}
                            onAnnulerEditionAuteur={handleAnnulerEditionAuteur}
                            onModifierAuteur={handleModifierAuteur}
                            onAjouterAuteur={handleAjouterAuteur}
                            onSupprimerAuteur={handleSupprimerAuteur}
                        /> :
                        <EmpruntsSection
                            empruntsActifs={empruntsActifsBib || []}
                            empruntsEnRetard={empruntsRetardBib || []}
                            livresDisponibles={livresDisponiblesPourEmprunt}
                            livreSelectionneId={livreEmpruntSelectionneId}
                            codeSerieAbonnementInput={codeSerieAbonnementInput}
                            onLivreSelectionneChange={setLivreEmpruntSelectionneId}
                            onCodeSerieAbonnementInputChange={setCodeSerieAbonnementInput}
                            onAjouterEmprunt={handleAjouterEmprunt}
                            onConfirmerRetour={handleConfirmerRetourEmprunt}
                        />
            }

            {statusMessage.length > 0 ? <p className="bibliothecaire-status">{statusMessage}</p> : null}
        </div>
    );
}

export default BibliothecairePage;
