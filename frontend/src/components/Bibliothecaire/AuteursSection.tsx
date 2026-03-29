import type { Auteur } from "./types";
import "./AuteursSection.css";

interface AuteurAvecCount extends Auteur {
    livresCount: number;
}

interface AuteursSectionProps {
    auteurRechercheInput: string;
    nouvelAuteurInput: string;
    auteurEnEditionId: number | null;
    nomAuteurEditionInput: string;
    auteursTries: AuteurAvecCount[];
    onAuteurRechercheChange: (value: string) => void;
    onNouvelAuteurChange: (value: string) => void;
    onAuteurEnEditionNomChange: (value: string) => void;
    onOuvrirEditionAuteur: (auteur: Auteur) => void;
    onAnnulerEditionAuteur: () => void;
    onModifierAuteur: () => void;
    onAjouterAuteur: () => void;
    onSupprimerAuteur: (auteurId: number) => void;
}

function AuteursSection({
    auteurRechercheInput,
    nouvelAuteurInput,
    auteurEnEditionId,
    nomAuteurEditionInput,
    auteursTries,
    onAuteurRechercheChange,
    onNouvelAuteurChange,
    onAuteurEnEditionNomChange,
    onOuvrirEditionAuteur,
    onAnnulerEditionAuteur,
    onModifierAuteur,
    onAjouterAuteur,
    onSupprimerAuteur
}: AuteursSectionProps) {
    return (
        <div className="auteur-management-section biblio-surface">
            <h3>Auteurs présents dans la bibliothèque</h3>

            <div className="auteur-toolbar">
                <input
                    className="auteur-input biblio-input"
                    value={auteurRechercheInput}
                    onChange={(e) => onAuteurRechercheChange(e.target.value)}
                    placeholder="Rechercher un auteur"
                />
            </div>

            <div className="auteur-add-row">
                <input
                    className="auteur-input biblio-input"
                    value={nouvelAuteurInput}
                    onChange={(e) => onNouvelAuteurChange(e.target.value)}
                    placeholder="Nom du nouvel auteur"
                />
                <button type="button" className="auteur-add-btn biblio-btn biblio-btn-success" onClick={onAjouterAuteur}>Ajouter auteur</button>
            </div>

            <ul className="auteur-list">
                {
                    auteursTries.map(auteur => (
                        <li key={auteur.id} className="auteur-item">
                            <div className="auteur-item-main">
                                {
                                    auteurEnEditionId === auteur.id ?
                                        <input
                                            className="auteur-input auteur-item-input biblio-input"
                                            value={nomAuteurEditionInput}
                                            onChange={(e) => onAuteurEnEditionNomChange(e.target.value)}
                                            placeholder="Nouveau nom de l'auteur"
                                        /> :
                                        <span className="auteur-nom">{auteur.nom}</span>
                                }
                                <span className={auteur.livresCount > 0 ? "auteur-livre-count linked" : "auteur-livre-count"}>
                                    {auteur.livresCount} livre(s)
                                </span>
                            </div>
                            <div className="auteur-actions">
                                {
                                    auteurEnEditionId === auteur.id ?
                                        <>
                                            <button type="button" className="auteur-edit-btn biblio-btn" onClick={onAnnulerEditionAuteur}>Annuler</button>
                                            <button type="button" className="auteur-edit-btn biblio-btn biblio-btn-success" onClick={onModifierAuteur}>Sauvegarder</button>
                                        </> :
                                        <button type="button" className="auteur-edit-btn biblio-btn" onClick={() => onOuvrirEditionAuteur(auteur)}>Modifier</button>
                                }
                                <button type="button" className="auteur-delete-btn biblio-btn biblio-btn-danger" onClick={() => onSupprimerAuteur(auteur.id)}>Supprimer</button>
                            </div>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
}

export default AuteursSection;
