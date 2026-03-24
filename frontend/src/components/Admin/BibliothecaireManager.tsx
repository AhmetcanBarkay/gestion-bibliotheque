import { useEffect, useState } from "react";
import { apiHelper } from "../../api/apiHelper";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import type { bibliothecairesResponse, createBibliothecaireBody, createBibliothecaireResponse, deleteBibliothecaireBody } from "@shared/types/api/adminApi.js";
import Input from "../ui/Input";
import Button from "../ui/Button";
import "./BibliothecaireManager.css";

interface BibliothecaireManagerProps {
    activeMenu: "create" | "delete";
}

function BibliothecaireManager({ activeMenu }: BibliothecaireManagerProps) {
    const [username, setUsername] = useState("");
    const [deletingUsername, setDeletingUsername] = useState<string | null>(null);
    const [createInputKey, setCreateInputKey] = useState(0);

    const [createErrors, setCreateErrors] = useState(new Set<string>());

    const [statusMessage, setStatusMessage] = useState("");
    const [listMessage, setListMessage] = useState("");
    const [bibliothecaires, setBibliothecaires] = useState<Array<{ id: number; username: string; date_created: string }>>([]);

    const handleCreateToggleError = (id: string) => (hasError: boolean) => {
        setCreateErrors(prev => {
            const next = new Set(prev);
            hasError ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const loadBibliothecaires = async () => {
        setListMessage("");
        const response = await apiHelper.get<bibliothecairesResponse>("/admin/bibliothecaires");
        const data = response.data;

        if (!data) {
            setListMessage("Réponse invalide du serveur");
            return;
        }

        if (!data.success || !data.bibliothecaires) {
            setListMessage(data.reason || "Erreur inconnue");
            return;
        }

        setBibliothecaires(data.bibliothecaires);
    };

    useEffect(() => {
        loadBibliothecaires();
    }, []);

    useEffect(() => {
        setStatusMessage("");
        setListMessage("");
    }, [activeMenu]);

    const handleCreate = async (setIsLoading: (loading: boolean) => void) => {
        setStatusMessage("");
        setIsLoading(true);

        const response = await apiHelper.post<createBibliothecaireBody, createBibliothecaireResponse>("/admin/bibliothecaire/create", {
            username
        });

        const data = response.data;
        if (!data) {
            setStatusMessage("Réponse invalide du serveur");
            setIsLoading(false);
            return;
        }

        if (!data.success) {
            setStatusMessage(data.reason || "Erreur inconnue");
            setIsLoading(false);
            return;
        }

        setStatusMessage(`Compte bibliothécaire créé:\nIdentifiant: ${username}\nMot de passe: ${data.generatedPassword || "non disponible"}`);
        setUsername("");
        setCreateInputKey(prev => prev + 1);
        await loadBibliothecaires();
        setIsLoading(false);
    };

    const handleDelete = async (targetUsername: string) => {
        setStatusMessage("");
        setDeletingUsername(targetUsername);

        const response = await apiHelper.post<deleteBibliothecaireBody, baseResponse>("/admin/bibliothecaire/delete", {
            username: targetUsername
        });

        const data = response.data;
        if (!data) {
            setStatusMessage("Réponse invalide du serveur");
            setDeletingUsername(null);
            return;
        }

        if (!data.success) {
            setStatusMessage(data.reason || "Erreur inconnue");
            setDeletingUsername(null);
            return;
        }

        setStatusMessage("Compte bibliothécaire supprimé");
        await loadBibliothecaires();
        setDeletingUsername(null);
    };

    return (
        <div className="admin-bibliothecaire-manager">
            <div className="admin-main-content">
                <h2>Gestion des bibliothécaires</h2>

                {
                    activeMenu === "create" ?
                        <div className="admin-panel admin-panel-create">
                            <h3>Ajouter un bibliothécaire</h3>
                            <Input
                                key={createInputKey}
                                label="Nom d'utilisateur"
                                value={username}
                                onChange={setUsername}
                                onToggleError={handleCreateToggleError("create_username")}
                                onCheck={(v) => v.length === 0 ? "Nom d'utilisateur requis" : null}
                            />
                            <Button
                                className="admin-main-btn"
                                onClick={handleCreate}
                                disabled={createErrors.size > 0}
                            >
                                Ajouter
                            </Button>
                        </div> : null
                }

                {
                    activeMenu === "delete" ?
                        <div className="admin-panel admin-panel-delete">
                            <h3>Supprimer un bibliothécaire</h3>
                            <div className="admin-list-wrapper">
                                <p className="admin-list-message">{listMessage.length === 0 ? "\u00A0" : listMessage}</p>
                                <ul className="admin-list">
                                    {
                                        bibliothecaires.map(b => (
                                            <li
                                                key={b.id}
                                                className={deletingUsername === b.username ? "is-deleting" : ""}
                                            >
                                                <div className="admin-list-user">
                                                    <span>{b.username}</span>
                                                    <span>{new Date(b.date_created).toLocaleDateString("fr-FR")}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="admin-delete-item-btn"
                                                    disabled={deletingUsername !== null}
                                                    onClick={() => handleDelete(b.username)}
                                                >
                                                    {deletingUsername === b.username ? "Suppression..." : "Supprimer"}
                                                </button>
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div> : null
                }

                {statusMessage.length > 0 ? <p className="admin-status">{statusMessage}</p> : null}

                {
                    activeMenu === "delete" ?
                        <Button
                            className="admin-refresh-btn"
                            onClick={() => loadBibliothecaires()}
                        >
                            Actualiser
                        </Button> : null
                }
            </div>
        </div>
    );
}

export default BibliothecaireManager;
