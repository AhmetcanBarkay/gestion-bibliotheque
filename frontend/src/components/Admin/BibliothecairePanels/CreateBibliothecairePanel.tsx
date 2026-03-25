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

        onStatusChange(`Compte bibliothécaire créé:\nIdentifiant: ${username}\nMot de passe: ${data.generatedPassword || "non disponible"}`);
        setUsername("");
        setCreateInputKey(prev => prev + 1);
        setIsLoading(false);
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
        </div>
    );
}

export default CreateBibliothecairePanel;
