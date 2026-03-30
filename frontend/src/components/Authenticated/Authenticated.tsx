import { useState } from "react";
import type { Role } from "@shared/types/roles";
import type { changePasswordBody, changePasswordResponse } from "@shared/types/api/authApi.js";
import AdminPage, { type AdminMenuKey } from "../Admin/AdminPage";
import BibliothecairePage, { type BibliothecaireMenuKey } from "../Bibliothecaire/BibliothecairePage";
import ClientPage, { type ClientMenuKey } from "../Client/ClientPage";
import AppNavbar from "../Footer/AppFooter";
import type { NavbarAction } from "../Footer/AppFooter";
import { apiHelper } from "../../api/apiHelper.js";
import "./Authenticated.css";

interface AuthenticatedProps {
    role: Role | null;
    username: string | null;
    onLogout: () => void;
}

const adminActions: NavbarAction<AdminMenuKey>[] = [
    { key: "create", label: "Ajouter" },
    { key: "delete", label: "Supprimer" }
];

const bibliothecaireActions: NavbarAction<BibliothecaireMenuKey>[] = [
    { key: "emprunts", label: "Emprunts" },
    { key: "catalogue", label: "Catalogue" },
    { key: "auteurs", label: "Auteurs" }
];

const clientActions: NavbarAction<ClientMenuKey>[] = [
    { key: "emprunts", label: "Mes emprunts" },
    { key: "catalogue", label: "Catalogue" },
    { key: "abonnement", label: "Mon abonnement" }
];

function Authenticated({ role, username, onLogout }: AuthenticatedProps) {
    const [adminMenu, setAdminMenu] = useState<AdminMenuKey>("create");
    const [bibliothecaireMenu, setBibliothecaireMenu] = useState<BibliothecaireMenuKey>("emprunts");
    const [clientMenu, setClientMenu] = useState<ClientMenuKey>("emprunts");
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changePasswordMessage, setChangePasswordMessage] = useState("");

    const canChangePassword = role === "client" || role === "bibliothecaire";

    const resetChangePasswordForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const toggleChangePassword = () => {
        setChangePasswordMessage("");
        setChangePasswordOpen(prev => !prev);
    };

    const handleChangePassword = async () => {
        setChangePasswordMessage("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setChangePasswordMessage("Tous les champs sont requis");
            return;
        }

        const response = await apiHelper.post<changePasswordBody, changePasswordResponse>(
            "/auth/changePassword",
            { currentPassword, newPassword, confirmPassword }
        );

        if (response.error) {
            setChangePasswordMessage(response.error);
            return;
        }

        const data = response.data;
        if (!data || !data.success) {
            setChangePasswordMessage(data?.reason || "Erreur lors du changement de mot de passe");
            return;
        }

        if (data.token) {
            localStorage.setItem("token", data.token);
        }

        resetChangePasswordForm();
        setChangePasswordOpen(false);
        setChangePasswordMessage("Mot de passe modifié avec succès");
    };

    return (
        <>
            <div className="authenticated-topbar">
                <span className="authenticated-topbar-user">Connecte en tant que {username}</span>
                <div className="authenticated-topbar-actions">
                    {
                        canChangePassword ?
                            <button type="button" onClick={toggleChangePassword} className="authenticated-change-password-btn">
                                {changePasswordOpen ? "Fermer" : "Changer mon MDP"}
                            </button> :
                            null
                    }
                    <button type="button" onClick={onLogout} className="authenticated-logout-btn">Deconnexion</button>
                </div>
            </div>

            {
                canChangePassword && changePasswordOpen ?
                    <div className="authenticated-password-panel">
                        <h3>Changer votre mot de passe</h3>
                        <div className="authenticated-password-fields">
                            <input
                                className="authenticated-password-input"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Mot de passe actuel"
                                maxLength={100}
                            />
                            <input
                                className="authenticated-password-input"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nouveau mot de passe"
                                maxLength={100}
                            />
                            <input
                                className="authenticated-password-input"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirmer le nouveau mot de passe"
                                maxLength={100}
                            />
                        </div>
                        <div className="authenticated-password-actions">
                            <button type="button" className="authenticated-password-save-btn" onClick={handleChangePassword}>Valider</button>
                            <button
                                type="button"
                                className="authenticated-password-cancel-btn"
                                onClick={() => {
                                    setChangePasswordMessage("");
                                    resetChangePasswordForm();
                                    setChangePasswordOpen(false);
                                }}
                            >
                                Annuler
                            </button>
                        </div>
                    </div> :
                    null
            }

            {
                changePasswordMessage.length > 0 ?
                    <p className="authenticated-password-message">{changePasswordMessage}</p> :
                    null
            }

            <div className="authenticated-navigation">
                {
                    role === "admin" ?
                        <AppNavbar actions={adminActions} activeKey={adminMenu} onSelect={setAdminMenu} /> :
                        role === "bibliothecaire" ?
                            <AppNavbar actions={bibliothecaireActions} activeKey={bibliothecaireMenu} onSelect={setBibliothecaireMenu} /> :
                            role === "client" ?
                                <AppNavbar actions={clientActions} activeKey={clientMenu} onSelect={setClientMenu} /> :
                                null
                }
            </div>

            <div id="authenticated-main-content">
                {
                    role === "admin" ?
                        <AdminPage activeMenu={adminMenu} /> :
                        role === "bibliothecaire" ?
                            <BibliothecairePage activeMenu={bibliothecaireMenu} onMenuChange={setBibliothecaireMenu} /> :
                            role === "client" ?
                                <ClientPage activeMenu={clientMenu} /> :
                                null
                }
            </div>
        </>
    );
}

export default Authenticated;