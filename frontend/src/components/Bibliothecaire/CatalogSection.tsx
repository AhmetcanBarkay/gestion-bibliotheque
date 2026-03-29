import { useState } from "react";
import type { Auteur, Emprunt, Exemplaire, Livre } from "./types";
import { getEmpruntActifPourExemplaire, getNomAuteurParId } from "./utils";
import Button from "../ui/Button";
import "./CatalogSection.css";

interface CatalogSectionProps {
    auteurs: Auteur[];
    livres: Livre[];
    exemplaires: Exemplaire[];
    emprunts: Emprunt[];
    livreTitreInput: string;
    livreAuteurRechercheInput: string;
    auteurIdsSelectionnes: number[];
    menuLivreOuvertId: number | null;
    livreEnEditionId: number | null;
    editionTitreInput: string;
    editionAuteurIdsSelectionnes: number[];
    editionAuteurRechercheInput: string;
    onLivreTitreChange: (value: string) => void;
    onLivreAuteurRechercheChange: (value: string) => void;
    onEditionTitreChange: (value: string) => void;
    onEditionAuteurRechercheChange: (value: string) => void;
    onToggleAuteurSelectionne: (auteurId: number) => void;
    onToggleAuteurEdition: (auteurId: number) => void;
    onAjouterLivre: () => void;
    onOuvrirEdition: (livre: Livre) => void;
    onSauvegarderEdition: () => void;
    onAnnulerEdition: () => void;
    onToggleMenuLivre: (livreId: number) => void;
    onSupprimerLivre: (livreId: number) => void;
    onAjouterExemplaire: (livreId: number) => void;
    onSupprimerExemplaire: (exemplaireId: number) => void;
    onOuvrirAuteursRaccourci: () => void;
}

interface BlocSelectionAuteursProps {
    valeurRecherche: string;
    placeholderRecherche: string;
    auteurs: Auteur[];
    idsSelectionnes: number[];
    onRechercheChange: (value: string) => void;
    onToggleAuteur: (auteurId: number) => void;
}

function BlocSelectionAuteurs({
    valeurRecherche,
    placeholderRecherche,
    auteurs,
    idsSelectionnes,
    onRechercheChange,
    onToggleAuteur
}: BlocSelectionAuteursProps) {
    return (
        <>
            <input
                className="livre-input biblio-input"
                value={valeurRecherche}
                onChange={(e) => onRechercheChange(e.target.value)}
                placeholder={placeholderRecherche}
            />

            <p className="selector-label">Sélectionner un ou plusieurs auteurs</p>
            <div className="auteur-button-list">
                {
                    auteurs.map(auteur => (
                        <button
                            key={auteur.id}
                            type="button"
                            className={`${idsSelectionnes.includes(auteur.id) ? "auteur-button selected" : "auteur-button"} biblio-btn biblio-btn-pill`}
                            onClick={() => onToggleAuteur(auteur.id)}
                        >
                            {auteur.nom}
                        </button>
                    ))
                }
            </div>
        </>
    );
}

function CatalogSection({
    auteurs,
    livres,
    exemplaires,
    emprunts,
    livreTitreInput,
    livreAuteurRechercheInput,
    auteurIdsSelectionnes,
    menuLivreOuvertId,
    livreEnEditionId,
    editionTitreInput,
    editionAuteurIdsSelectionnes,
    editionAuteurRechercheInput,
    onLivreTitreChange,
    onLivreAuteurRechercheChange,
    onEditionTitreChange,
    onEditionAuteurRechercheChange,
    onToggleAuteurSelectionne,
    onToggleAuteurEdition,
    onAjouterLivre,
    onOuvrirEdition,
    onSauvegarderEdition,
    onAnnulerEdition,
    onToggleMenuLivre,
    onSupprimerLivre,
    onAjouterExemplaire,
    onSupprimerExemplaire,
    onOuvrirAuteursRaccourci
}: CatalogSectionProps) {
    const [ajoutLivreOuvert, setAjoutLivreOuvert] = useState(false);

    const filteredAuteursPourSelection = auteurs.filter(auteur =>
        auteur.nom.toLowerCase().includes(livreAuteurRechercheInput.trim().toLowerCase())
    );

    const filteredAuteursPourEdition = auteurs.filter(auteur =>
        auteur.nom.toLowerCase().includes(editionAuteurRechercheInput.trim().toLowerCase())
    );

    const livresOrdonnes = livreEnEditionId === null
        ? livres
        : [...livres].sort((a, b) => Number(b.id === livreEnEditionId) - Number(a.id === livreEnEditionId));

    return (
        <>
            <h2>Catalogue des livres</h2>
            <div className="livres-liste-section">
                {
                    livresOrdonnes.map(livre => {
                        const auteursLivre = livre.auteurIds
                            .map(auteurId => getNomAuteurParId(auteurs, auteurId))
                            .filter((name): name is string => !!name);
                        const exemplairesLivre = exemplaires.filter(exemplaire => exemplaire.livreId === livre.id);
                        const isEditing = livreEnEditionId === livre.id;

                        return (
                            <div key={livre.id} className={isEditing ? "livre-carte editing" : "livre-carte"}>
                                <div className="livre-carte-header">
                                    <div className="livre-main">
                                        {
                                            isEditing ?
                                                <div className="livre-edit-panel">
                                                    <input
                                                        className="livre-input biblio-input"
                                                        value={editionTitreInput}
                                                        onChange={(e) => onEditionTitreChange(e.target.value)}
                                                        placeholder="Titre"
                                                    />

                                                    <BlocSelectionAuteurs
                                                        valeurRecherche={editionAuteurRechercheInput}
                                                        placeholderRecherche="Rechercher auteur pour modifier ce livre"
                                                        auteurs={filteredAuteursPourEdition}
                                                        idsSelectionnes={editionAuteurIdsSelectionnes}
                                                        onRechercheChange={onEditionAuteurRechercheChange}
                                                        onToggleAuteur={onToggleAuteurEdition}
                                                    />
                                                </div> :
                                                <h3>{livre.titre}</h3>
                                        }
                                        {
                                            isEditing ?
                                                null :
                                                <p className="livre-auteurs">Auteurs: {auteursLivre.join(", ") || "Aucun"}</p>
                                        }

                                        {
                                            isEditing ? null :
                                                <p className="livre-exemplaires-count">{exemplairesLivre.length} exemplaire(s)</p>
                                        }
                                    </div>

                                    <div className={isEditing ? "livre-actions edit-actions" : "livre-actions"}>
                                        {
                                            isEditing ?
                                                <>
                                                    <Button className="livre-action-btn livre-action-btn-save biblio-btn biblio-btn-success" onClick={() => onSauvegarderEdition()}>Enregistrer</Button>
                                                    <Button className="livre-action-btn livre-action-btn-cancel biblio-btn biblio-btn-danger" onClick={() => onAnnulerEdition()}>Annuler</Button>
                                                </> :
                                                <>
                                                    <Button
                                                        className="livre-menu-trigger biblio-btn"
                                                        onClick={() => onToggleMenuLivre(livre.id)}
                                                    >
                                                        ...
                                                    </Button>
                                                    {
                                                        menuLivreOuvertId === livre.id ?
                                                            <div className="livre-menu">
                                                                <Button className="livre-menu-edit-btn biblio-btn biblio-btn-info" onClick={() => onOuvrirEdition(livre)}>Modifier le livre</Button>
                                                                <Button className="livre-menu-delete-btn biblio-btn biblio-btn-danger" onClick={() => onSupprimerLivre(livre.id)}>Supprimer le livre</Button>
                                                                <Button className="livre-menu-exemplaire-btn biblio-btn biblio-btn-success" onClick={() => onAjouterExemplaire(livre.id)}>Ajouter un exemplaire</Button>
                                                            </div> : null
                                                    }
                                                </>
                                        }
                                    </div>
                                </div>

                                {
                                    isEditing ?
                                        <div className="exemplaires-section">
                                            <h4>Exemplaires</h4>
                                            {
                                                exemplairesLivre.length === 0 ?
                                                    <p className="exemplaire-empty">Aucun exemplaire</p> :
                                                    <ul className="exemplaires-list">
                                                        {
                                                            exemplairesLivre.map(exemplaire => {
                                                                const empruntActif = getEmpruntActifPourExemplaire(emprunts, exemplaire.id);
                                                                const estEmprunte = !!empruntActif;
                                                                return (
                                                                    <li key={exemplaire.id} className={estEmprunte ? "exemplaire-item borrowed" : "exemplaire-item"}>
                                                                        <div>
                                                                            <p>Exemplaire nº{exemplaire.id}</p>
                                                                            {
                                                                                estEmprunte ?
                                                                                    <p className="exemplaire-state">Emprunté (Utilisateur : {empruntActif.username || "inconnu"})</p> :
                                                                                    <p className="exemplaire-state">Disponible</p>
                                                                            }
                                                                        </div>
                                                                        <Button
                                                                            className="supprimer-exemplaire-btn biblio-btn biblio-btn-danger"
                                                                            disabled={estEmprunte}
                                                                            onClick={() => onSupprimerExemplaire(exemplaire.id)}
                                                                        >
                                                                            Supprimer
                                                                        </Button>
                                                                    </li>
                                                                );
                                                            })
                                                        }
                                                    </ul>
                                            }
                                        </div> : null
                                }
                            </div>
                        );
                    })
                }
            </div>

            <div className="ajout-livre-wrapper">
                <Button
                    className="livre-add-toggle-btn biblio-btn biblio-btn-success biblio-btn-pill"
                    onClick={() => setAjoutLivreOuvert(prev => !prev)}
                >
                    {ajoutLivreOuvert ? "- Fermer" : "+ Ajouter un livre"}
                </Button>

                {
                    ajoutLivreOuvert ?
                        <div className="ajout-livre-section biblio-surface">
                            <h3>Ajouter un nouveau livre</h3>
                            <div className="ajout-livre-raccourcis">
                                <button
                                    type="button"
                                    className="ajout-livre-raccourci-btn biblio-btn biblio-btn-info biblio-btn-pill"
                                    onClick={onOuvrirAuteursRaccourci}
                                >
                                    + Ajouter un auteur
                                </button>
                            </div>
                            <input
                                className="livre-input biblio-input"
                                value={livreTitreInput}
                                onChange={(e) => onLivreTitreChange(e.target.value)}
                                placeholder="Titre du livre"
                            />

                            <BlocSelectionAuteurs
                                valeurRecherche={livreAuteurRechercheInput}
                                placeholderRecherche="Rechercher auteur pour ce livre"
                                auteurs={filteredAuteursPourSelection}
                                idsSelectionnes={auteurIdsSelectionnes}
                                onRechercheChange={onLivreAuteurRechercheChange}
                                onToggleAuteur={onToggleAuteurSelectionne}
                            />
                            <Button className="livre-submit-btn biblio-btn biblio-btn-success" onClick={() => onAjouterLivre()}>Ajouter le livre</Button>
                        </div> : null
                }
            </div>
        </>
    );
}

export default CatalogSection;
