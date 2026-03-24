import { useState, useEffect } from 'react';
import Authentification from './components/Authentication/Authentication'
import Loading from './components/Loading';
import { apiHelper } from './api/apiHelper';
import type { verifyTokenBody, verifyTokenResponse } from '@shared/types/api/authApi';
import type { Role } from '@shared/types/roles';
import BibliothecaireManager from './components/Admin/BibliothecaireManager';
import AppFooter from './components/Footer/AppFooter';

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [adminMenu, setAdminMenu] = useState<"create" | "delete">("create")

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {

        return setIsChecking(false);

      };
      await apiHelper.post<verifyTokenBody, verifyTokenResponse>("/auth/verifyToken", { token })
        .then(res => {
          const apiResponse = res.data;

          if (!apiResponse) {
            return;
          };
          if (apiResponse.success) {
            setLoggedIn(true);
            setRole(apiResponse.role || null);
            setUsername(apiResponse.username || null);
          } else {
            localStorage.removeItem("token");
          };
        });

      setIsChecking(false);
    })();
  }, []);

  if (isChecking) {
    return <Loading />
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setRole(null);
    setUsername(null);
  };

  const adminActions = [
    { key: "create", label: "Ajouter" },
    { key: "delete", label: "Supprimer" }
  ];

  let content = <Authentification onAuthSuccess={({ role, username }) => {
    setLoggedIn(true);
    setRole(role);
    setUsername(username);
  }} />;

  let footerActions: Array<{ key: string, label: string }> = [];
  let footerActiveKey: string | undefined = undefined;
  let onFooterSelect: ((key: string) => void) | undefined = undefined;

  if (loggedIn && role === "admin") {
    content = (
      <>
        <div style={{ width: "min(900px, 95vw)", margin: "30px auto 0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "#222" }}>Connecté: {username} (admin)</span>
          <button onClick={handleLogout} style={{ border: "none", height: "36px", padding: "0 12px", borderRadius: "8px", backgroundColor: "var(--primary-color)", color: "#fff", fontWeight: 700 }}>Déconnexion</button>
        </div>
        <BibliothecaireManager activeMenu={adminMenu} />
      </>
    );
    footerActions = adminActions;
    footerActiveKey = adminMenu;
    onFooterSelect = (key) => {
      if (key === "create" || key === "delete") {
        setAdminMenu(key);
      }
    };
  }

  if (loggedIn && role !== "admin") {
    content = <div className="center" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
      <div>Connecté: {username} ({role || "utilisateur"})</div>
      <button onClick={handleLogout} style={{ border: "none", height: "36px", padding: "0 12px", borderRadius: "8px", backgroundColor: "var(--primary-color)", color: "#fff", fontWeight: 700 }}>Déconnexion</button>
    </div>;
  }

  return (
    <div className="app-shell">
      <main className="app-main">{content}</main>
      {
        loggedIn ?
          <AppFooter
            actions={footerActions}
            activeKey={footerActiveKey}
            onSelect={onFooterSelect}
          /> : null
      }
    </div>
  )

}

export default App
