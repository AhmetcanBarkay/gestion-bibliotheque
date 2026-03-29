import { useState } from "react";
import { apiHelper } from "../../../api/apiHelper";
import type { createBibliothecaireBody, createBibliothecaireResponse } from "@shared/types/api/adminApi.js";
import { getUsernameRulesErrors, USERNAME_ALLOWED_INPUT_REGEX, USERNAME_MAX_LENGTH } from "@shared/utils/usernameRules.js";
import Input from "../../ui/Input";
import Button from "../../ui/Button";

interface CreateBibliothecairePanelProps {
    onStatusChange: (message: string) => void;
}

function CreateBibliothecairePanel({
    onStatusChange
}: CreateBibliothecairePanelProps) {
    const [username, setUsername] = useState("");
    const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);
    const [createInputKey, setCreateInputKey] = useState(0);
    const [createErrors, setCreateErrors] = useState(new Set<string>());

    const handleCreateUsernameChange = (value: string) => {
        if (value.length > USERNAME_MAX_LENGTH) return;
        if (!USERNAME_ALLOWED_INPUT_REGEX.test(value)) return;
        setUsername(value);
    };

    const handleCreateToggleError = (id: string) => (hasError: boolean) => {
        setCreateErrors(prev => {
            const next = new Set(prev);
            hasError ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleCreate = async (setIsLoading: (loading: boolean) => void) => {
        onStatusChange("");
        setCreatedCredentials(null);
        setIsLoading(true);

        const response = await apiHelper.post<createBibliothecaireBody, createBibliothecaireResponse>("/admin/bibliothecaire/create", {
            username
        });

        const data = response.data;
        if (!data) {
            onStatusChange("Réponse invalide du serveur");
            setIsLoading(false);
            return;
        }

        if (!data.success) {
            onStatusChange(data.reason || "Erreur inconnue");
            setIsLoading(false);
            return;
        }

        const generatedPassword = data.generatedPassword || "non disponible";
        setCreatedCredentials({ username, password: generatedPassword });
        onStatusChange("Compte bibliothécaire créé");
        setUsername("");
        setCreateInputKey(prev => prev + 1);
        setIsLoading(false);
    };

    const copierTexte = async (texte: string, succesMessage: string) => {
        try {
            await navigator.clipboard.writeText(texte);
            onStatusChange(succesMessage);
        } catch {
            onStatusChange("Impossible de copier dans le presse-papiers");
        }
    };

    return (
        <div className="admin-panel admin-panel-create">
            <h3>Ajouter un bibliothécaire</h3>
            <Input
                key={createInputKey}
                label="Nom d'utilisateur"
                value={username}
                onChange={handleCreateUsernameChange}
                onToggleError={handleCreateToggleError("create_username")}
                maxLength={USERNAME_MAX_LENGTH}
                onCheck={(v) => {
                    if (v.length === 0) return "Nom d'utilisateur requis";
                    const rules = getUsernameRulesErrors(v);
                    return rules.length === 0 ? null : `Nom d'utilisateur invalide:\n- ${rules.join("\n- ")}`;
                }}
            />
            <Button
                className="admin-main-btn"
                onClick={handleCreate}
                disabled={createErrors.size > 0}
            >
                Ajouter
            </Button>

            {
                createdCredentials ?
                    <div className="admin-created-credentials" aria-live="polite">
                        <div className="admin-created-credentials-row">
                            <span className="admin-created-credentials-label">Identifiant</span>
                            <span className="admin-created-credentials-value">{createdCredentials.username}</span>
                            <button
                                type="button"
                                className="admin-copy-btn"
                                onClick={() => copierTexte(createdCredentials.username, "Identifiant copié")}
                            >
                                Copier
                            </button>
                        </div>

                        <div className="admin-created-credentials-row">
                            <span className="admin-created-credentials-label">Mot de passe</span>
                            <span className="admin-created-credentials-value">{createdCredentials.password}</span>
                            <button
                                type="button"
                                className="admin-copy-btn"
                                onClick={() => copierTexte(createdCredentials.password, "Mot de passe copié")}
                            >
                                Copier
                            </button>
                        </div>

                        <button
                            type="button"
                            className="admin-copy-btn admin-copy-btn-wide"
                            onClick={() => copierTexte(`Identifiant: ${createdCredentials.username}\nMot de passe: ${createdCredentials.password}`, "Identifiant + mot de passe copiés")}
                        >
                            Copier les deux
                        </button>
                    </div> : null
            }
        </div>
    );
}

export default CreateBibliothecairePanel;
