import { useEffect, useState } from "react";
import CreateBibliothecairePanel from "./BibliothecairePanels/CreateBibliothecairePanel";
import DeleteBibliothecairePanel from "./BibliothecairePanels/DeleteBibliothecairePanel";
import "./BibliothecaireManager.css";

interface BibliothecaireManagerProps {
    activeMenu: "create" | "delete";
}

function BibliothecaireManager({ activeMenu }: BibliothecaireManagerProps) {
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        setStatusMessage("");
    }, [activeMenu]);

    return (
        <div className="admin-bibliothecaire-manager">
            <div className="admin-main-content">
                <h2>Gestion des bibliothécaires</h2>

                {
                    activeMenu === "create" ?
                        <CreateBibliothecairePanel
                            onStatusChange={setStatusMessage}
                        /> : null
                }

                {
                    activeMenu === "delete" ?
                        <DeleteBibliothecairePanel
                            onStatusChange={setStatusMessage}
                        /> : null
                }
                {statusMessage.length > 0 ? <p style={{ marginTop: "10px" }} className="admin-status">{statusMessage}</p> : null}

            </div>
        </div>
    );
}

export default BibliothecaireManager;
