import { useState } from "react";
import type { Role } from "@shared/types/roles";
import AdminPage, { type AdminMenuKey } from "../Admin/AdminPage";
import BibliothecairePage, { type BibliothecaireMenuKey } from "../Bibliothecaire/BibliothecairePage";
import ClientPage, { type ClientMenuKey } from "../Client/ClientPage";
import AppNavbar from "../Footer/AppFooter";
import type { NavbarAction } from "../Footer/AppFooter";
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

    return (
        <>
            <div className="authenticated-topbar">
                <span className="authenticated-topbar-user">Connecte en tant que {username}</span>
                <button type="button" onClick={onLogout} className="authenticated-logout-btn">Deconnexion</button>
            </div>

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