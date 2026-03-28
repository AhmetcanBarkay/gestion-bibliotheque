import type { Role } from "@shared/types/roles";
import AdminPage from "../Admin/AdminPage";
import BibliothecairePage from "../Bibliothecaire/BibliothecairePage";
import "./Authenticated.css";

interface AuthenticatedProps {
    role: Role | null;
    username: string | null;
    onLogout: () => void;
}
function renderContentForRole(role: Role | null) {
    switch (role) {
        case "admin":
            return <AdminPage />;
        case "bibliothecaire":
            return <BibliothecairePage />;
        default:
            return <div>Content for default role, role: {role}</div>;
    }
};
function Authenticated({ role, username, onLogout }: AuthenticatedProps) {
    return (
        <>
            <div style={{ width: "min(900px, 85vw)", margin: "30px auto 0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#222" }}>Connecté en tant que {username}</span>
                <button onClick={onLogout} style={{ border: "none", height: "36px", padding: "0 12px", borderRadius: "8px", backgroundColor: "var(--primary-color)", color: "#fff", fontWeight: 700 }}>Déconnexion</button>
            </div>
            <div id="authenticated-main-content">
                {renderContentForRole(role)}
            </div>
        </>
    );
}

export default Authenticated;