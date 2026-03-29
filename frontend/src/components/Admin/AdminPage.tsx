import BibliothecaireManager from "./BibliothecaireManager";

export type AdminMenuKey = "create" | "delete";

interface AdminPageProps {
    activeMenu: AdminMenuKey;
}

function AdminPage({ activeMenu }: AdminPageProps) {

    return (
        <BibliothecaireManager activeMenu={activeMenu} />
    );
}

export default AdminPage;