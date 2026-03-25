import { useState } from "react";
import BibliothecaireManager from "./BibliothecaireManager";
import AppFooter from "../Footer/AppFooter";
import type { FooterAction } from "../Footer/AppFooter";

type AdminMenuKey = "create" | "delete";

function AdminPage() {
    const [adminMenu, setAdminMenu] = useState<AdminMenuKey>("create");

    const adminActions: FooterAction<AdminMenuKey>[] = [
        { key: "create", label: "Ajouter" },
        { key: "delete", label: "Supprimer" }
    ];

    return (
        <>
            <BibliothecaireManager activeMenu={adminMenu} />
            <AppFooter
                actions={adminActions}
                activeKey={adminMenu}
                onSelect={(key) => {
                    setAdminMenu(key);
                }}
            />
        </>
    );
}

export default AdminPage;