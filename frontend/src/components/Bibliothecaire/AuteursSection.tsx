import type { Auteur } from "./types";
import "./AuteursSection.css";

interface AuteurAvecCount extends Auteur {
    livresCount: number;
}

interface AuteursSectionProps {
    auteurRechercheInput: string;
    nouvelAuteurInput: string;
    auteursTries: AuteurAvecCount[];
    onAuteurRechercheChange: (value: string) => void;
    onNouvelAuteurChange: (value: string) => void;
    onAjouterAuteur: () => void;
    onSupprimerAuteur: (auteurId: number) => void;
}

function AuteursSection({
    auteurRechercheInput,
    nouvelAuteurInput,
    auteursTries,
    onAuteurRechercheChange,
    onNouvelAuteurChange,
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
                                <span>{auteur.nom}</span>
                                <span className={auteur.livresCount > 0 ? "auteur-livre-count linked" : "auteur-livre-count"}>
                                    {auteur.livresCount} livre(s)
                                </span>
                            </div>
                            <button type="button" className="auteur-delete-btn biblio-btn biblio-btn-danger" onClick={() => onSupprimerAuteur(auteur.id)}>Supprimer</button>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
}

export default AuteursSection;
