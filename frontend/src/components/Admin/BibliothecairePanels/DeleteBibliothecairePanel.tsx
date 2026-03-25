import { useEffect, useState } from "react";
import { apiHelper } from "../../../api/apiHelper";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import type { bibliothecairesResponse, deleteBibliothecaireBody } from "@shared/types/api/adminApi.js";
import Button from "../../ui/Button";

interface DeleteBibliothecairePanelProps {
    onStatusChange: (message: string) => void;
}

function DeleteBibliothecairePanel({
    onStatusChange
}: DeleteBibliothecairePanelProps) {
    const [deletingUsername, setDeletingUsername] = useState<string | null>(null);
    const [listMessage, setListMessage] = useState("");
    const [bibliothecaires, setBibliothecaires] = useState<Array<{ id: number; username: string; date_created: string }>>([]);

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

    const handleDelete = async (targetUsername: string) => {
        onStatusChange("");
        setDeletingUsername(targetUsername);

        const response = await apiHelper.post<deleteBibliothecaireBody, baseResponse>("/admin/bibliothecaire/delete", {
            username: targetUsername
        });

        const data = response.data;
        if (!data) {
            onStatusChange("Réponse invalide du serveur");
            setDeletingUsername(null);
            return;
        }

        if (!data.success) {
            onStatusChange(data.reason || "Erreur inconnue");
            setDeletingUsername(null);
            return;
        }

        onStatusChange("Compte bibliothécaire supprimé");
        await loadBibliothecaires();
        setDeletingUsername(null);
    };

    return (
        <div className="admin-panel admin-panel-delete">
            <h3>Supprimer un bibliothécaire</h3>
            <div className="admin-list-wrapper">
                <p className="admin-list-message">{listMessage}</p>
                <ul className="admin-list">
                    {
                        bibliothecaires.map(b => (
                            <li
                                key={b.id}
                                className={deletingUsername === b.username ? "is-deleting" : ""}
                            >
                                <div className="admin-list-user">
                                    <span>Identifiant : {b.username}</span>
                                    <span>Date de création : {new Date(b.date_created).toLocaleDateString("fr-FR")}</span>
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
            <Button
                className="admin-refresh-btn"
                onClick={() => loadBibliothecaires()}
            >
                Actualiser
            </Button>
        </div>
    );
}

export default DeleteBibliothecairePanel;
