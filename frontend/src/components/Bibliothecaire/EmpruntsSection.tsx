import type { empruntBibliothecaireItem } from "@shared/types/api/bibliothecaireApi.js";
import { useMemo, useState } from "react";
import Button from "../ui/Button";
import "./EmpruntsSection.css";

interface LivreDisponibleOption {
    id: number;
    titre: string;
    hasExemplaireDisponible: boolean;
}

interface ExemplaireDisponibleOption {
    id: number;
}

interface EmpruntsSectionProps {
    empruntsActifs: empruntBibliothecaireItem[];
    empruntsEnRetard: empruntBibliothecaireItem[];
    livresDisponibles: LivreDisponibleOption[];
    exemplairesDisponibles: ExemplaireDisponibleOption[];
    livreSelectionneId: number | null;
    exemplaireSelectionneId: number | null;
    codeSerieAbonnementInput: string;
    onLivreSelectionneChange: (livreId: number | null) => void;
    onExemplaireSelectionneChange: (exemplaireId: number | null) => void;
    onCodeSerieAbonnementInputChange: (value: string) => void;
    onAjouterEmprunt: () => void;
    onConfirmerRetour: (empruntId: number) => void;
}

function EmpruntsSection({
    empruntsActifs,
    empruntsEnRetard,
    livresDisponibles,
    exemplairesDisponibles,
    livreSelectionneId,
    exemplaireSelectionneId,
    codeSerieAbonnementInput,
    onLivreSelectionneChange,
    onExemplaireSelectionneChange,
    onCodeSerieAbonnementInputChange,
    onAjouterEmprunt,
    onConfirmerRetour
}: EmpruntsSectionProps) {
    const [creationOuverte, setCreationOuverte] = useState(false);

    const empruntsTries = useMemo(() => {
        const items = [...empruntsActifs, ...empruntsEnRetard];
        return items.sort((a, b) => a.dateRetourPrevue.localeCompare(b.dateRetourPrevue));
    }, [empruntsActifs, empruntsEnRetard]);

    const idsRetard = useMemo(() => new Set(empruntsEnRetard.map(item => item.id)), [empruntsEnRetard]);

    return (
        <>
            <div className="emprunts-header-stats">
                <div className="emprunts-stat-card">
                    <p className="emprunts-stat-label">Emprunts actuels</p>
                    <p className="emprunts-stat-value">{empruntsActifs.length}</p>
                </div>
                <div className="emprunts-stat-card emprunts-stat-card-retard">
                    <p className="emprunts-stat-label">Emprunts en retard</p>
                    <p className="emprunts-stat-value">{empruntsEnRetard.length}</p>
                </div>
            </div>





            <div className="bibliothecaire-action-panel biblio-surface">

                <div>
                    <h3>Emprunts</h3>
                </div>

                {
                    empruntsTries.length === 0 ?
                        <p className="emprunts-muted">Aucun emprunt actif.</p> :
                        <ul className="emprunts-list emprunts-list-global">
                            {
                                empruntsTries.map(emprunt => {
                                    const isRetard = idsRetard.has(emprunt.id);
                                    return (
                                        <li key={emprunt.id} className={isRetard ? "emprunts-item emprunts-item-retard" : "emprunts-item"}>
                                            <div className="emprunts-item-top">
                                                <p><strong>{emprunt.titreLivre}</strong> (exemplaire nº{emprunt.exemplaireId})</p>
                                                {isRetard ? <span className="emprunts-retard-badge">EN RETARD</span> : null}
                                            </div>
                                            <p>Utilisateur : {emprunt.username || "inconnu"}</p>
                                            <p>Début : {emprunt.dateDebut}</p>
                                            <p>Retour prévu : {emprunt.dateRetourPrevue}</p>
                                            <Button className="biblio-btn biblio-btn-info emprunts-return-btn" onClick={() => onConfirmerRetour(emprunt.id)}>
                                                Confirmer retour
                                            </Button>
                                        </li>
                                    );
                                })
                            }
                        </ul>
                }
            </div>

            <div className="emprunts-create-toggle-row">
                <Button
                    className="emprunts-new-btn biblio-btn biblio-btn-success biblio-btn-pill"
                    onClick={() => setCreationOuverte(prev => !prev)}
                >
                    {creationOuverte ? "- Fermer" : "+ Nouvel emprunt"}
                </Button>
            </div>

            {
                creationOuverte ?
                    <div className="bibliothecaire-action-panel biblio-surface emprunts-create-panel">
                        <div className="emprunts-create-header">
                            <h4>Créer un emprunt</h4>
                            <p>Sélectionne un livre, puis un exemplaire disponible et le code série du client.</p>
                        </div>

                        <div className="emprunts-create-row">
                            <label className="emprunts-field">
                                <span className="emprunts-field-label">1. Livre</span>
                                <select
                                    className="emprunts-input biblio-input"
                                    value={livreSelectionneId ?? ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        onLivreSelectionneChange(value === "" ? null : Number(value));
                                    }}
                                >
                                    <option value="">Choisir un livre</option>
                                    {
                                        livresDisponibles.map(livre => (
                                            <option key={livre.id} value={livre.id} disabled={!livre.hasExemplaireDisponible}>
                                                {livre.titre}{livre.hasExemplaireDisponible ? "" : " (tous exemplaires pris)"}
                                            </option>
                                        ))
                                    }
                                </select>
                            </label>

                            <label className="emprunts-field">
                                <span className="emprunts-field-label">2. Exemplaire</span>
                                <select
                                    className="emprunts-input biblio-input"
                                    value={exemplaireSelectionneId ?? ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        onExemplaireSelectionneChange(value === "" ? null : Number(value));
                                    }}
                                    disabled={livreSelectionneId === null}
                                >
                                    <option value="">Choisir un exemplaire</option>
                                    {
                                        exemplairesDisponibles.map(exemplaire => (
                                            <option key={exemplaire.id} value={exemplaire.id}>
                                                Exemplaire nº{exemplaire.id}
                                            </option>
                                        ))
                                    }
                                </select>
                            </label>

                            <label className="emprunts-field">
                                <span className="emprunts-field-label">3. Code série</span>
                                <input
                                    className="emprunts-input biblio-input"
                                    value={codeSerieAbonnementInput}
                                    onChange={(e) => onCodeSerieAbonnementInputChange(e.target.value.slice(0, 6))}
                                    maxLength={6}
                                    placeholder="Ex: A9kT2x"
                                />
                            </label>
                        </div>

                        <div className="emprunts-create-actions">
                            <Button
                                className="emprunts-add-btn biblio-btn biblio-btn-success"
                                onClick={() => onAjouterEmprunt()}
                            >
                                Valider l'emprunt
                            </Button>
                        </div>
                    </div> : null
            }
        </>
    );
}

export default EmpruntsSection;
