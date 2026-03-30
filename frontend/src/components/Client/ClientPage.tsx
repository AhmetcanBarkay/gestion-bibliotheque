import { useEffect, useState } from "react";
import { createApiReader } from "../../api/apiRequest.js";
import { API_MESSAGES } from "@shared/constants/messages.js";
import type {
    abonnementClientItem,
    corpsExtensionAbonnement,
    corpsSouscriptionAbonnement,
    empruntClientItem,
    livreCatalogueClientItem,
    reponseAbonnementClient,
    reponseActionAbonnement,
    reponseCatalogueClient,
    reponseEmpruntsClient
} from "@shared/types/api/clientApi.js";
import "./ClientPage.css";

export type ClientMenuKey = "emprunts" | "catalogue" | "abonnement";

interface ClientPageProps {
    activeMenu: ClientMenuKey;
}

function formatterDate(dateValue: string | null): string {
    if (!dateValue) return "-";

    const normalisee = dateValue.replace("T", " ").slice(0, 16);
    const [datePart, heurePart] = normalisee.split(" ");
    if (!datePart) return dateValue;

    const [annee, mois, jour] = datePart.split("-");
    if (!annee || !mois || !jour) return dateValue;

    if (heurePart) {
        return `${jour}/${mois}/${annee} ${heurePart.slice(0, 5)}`;
    }

    return `${jour}/${mois}/${annee}`;
}

function ClientPage({ activeMenu }: ClientPageProps) {
    const [statusMessage, setStatusMessage] = useState("");
    const [choixSouscriptionOuvert, setChoixSouscriptionOuvert] = useState(false);
    const [choixExtensionOuvert, setChoixExtensionOuvert] = useState(false);
    const [abonnement, setAbonnement] = useState<abonnementClientItem>({
        statut: "aucun",
        codeSerie: "",
        dateFin: null
    });
    const [problemeActuelCatalogue, setProblemeActuelCatalogue] = useState<reponseCatalogueClient["problemeActuel"]>("aucun");
    const [nombreEmpruntsCatalogue, setNombreEmpruntsCatalogue] = useState<number | null>(null);
    const [nombreRetardsCatalogue, setNombreRetardsCatalogue] = useState<number | null>(null);
    const [empruntsActifs, setEmpruntsActifs] = useState<empruntClientItem[]>([]);
    const [empruntsEnRetard, setEmpruntsEnRetard] = useState<empruntClientItem[]>([]);
    const [livresDisponibles, setLivresDisponibles] = useState<livreCatalogueClientItem[]>([]);
    const { lireGet, lirePost } = createApiReader(setStatusMessage);

    const chargerEmprunts = async () => {
        const data = await lireGet<reponseEmpruntsClient>("/client/emprunts");
        if (!data) return;
        if (!data.success) {
            setStatusMessage(data.reason || "Erreur de chargement des emprunts");
            return;
        }

        setEmpruntsActifs(data.empruntsActifs || []);
        setEmpruntsEnRetard(data.empruntsEnRetard || []);
    };

    const chargerAbonnement = async () => {
        const data = await lireGet<reponseAbonnementClient>("/client/abonnement");
        if (!data) return;
        if (!data.success || !data.abonnement) {
            setStatusMessage(data.reason || "Erreur de chargement de l'abonnement");
            return;
        }

        setAbonnement(data.abonnement);
    };

    const chargerCatalogue = async () => {
        const data = await lireGet<reponseCatalogueClient>("/client/catalogue");
        if (!data) return;
        if (!data.success) {
            setStatusMessage(data.reason || "Erreur de chargement du catalogue");
            return;
        }

        const livresTries = [...(data.livresDisponibles || [])]
            .sort((a, b) => a.titreLivre.localeCompare(b.titreLivre, "fr"));

        setLivresDisponibles(livresTries);
        setProblemeActuelCatalogue(data.problemeActuel || "aucun");
        setNombreEmpruntsCatalogue(typeof data.nombreEmpruntsEnCours === "number" ? data.nombreEmpruntsEnCours : null);
        setNombreRetardsCatalogue(typeof data.nombreEmpruntsEnRetard === "number" ? data.nombreEmpruntsEnRetard : null);
    };

    useEffect(() => {
        (async () => {
            await chargerEmprunts();
            await chargerCatalogue();
            await chargerAbonnement();
        })();
    }, []);

    useEffect(() => {
        setChoixSouscriptionOuvert(false);
        setChoixExtensionOuvert(false);
        setStatusMessage("");
    }, [activeMenu]);

    const handleSouscrire = () => {
        setChoixSouscriptionOuvert(true);
        setStatusMessage("");
    };

    const handleConfirmerSouscription = async (nbMois: number) => {
        const data = await lirePost<corpsSouscriptionAbonnement, reponseActionAbonnement>("/client/abonnement/souscrire", { dureeMois: nbMois });
        if (!data) return;
        if (!data.success || !data.abonnement) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        setAbonnement(data.abonnement);
        setChoixSouscriptionOuvert(false);
        setChoixExtensionOuvert(false);
        setStatusMessage(`Abonnement activé pour ${nbMois} mois, jusqu'au ${formatterDate(data.abonnement.dateFin)}.`);
    };

    const handleAnnulerSouscription = () => {
        setChoixSouscriptionOuvert(false);
        setStatusMessage("");
    };

    const handleEtendre = () => {
        setChoixExtensionOuvert(true);
        setStatusMessage("");
    };

    const handleConfirmerExtension = async (nbMois: number) => {
        const data = await lirePost<corpsExtensionAbonnement, reponseActionAbonnement>("/client/abonnement/etendre", { dureeMois: nbMois });
        if (!data) return;
        if (!data.success || !data.abonnement) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        setAbonnement(data.abonnement);
        setChoixExtensionOuvert(false);
        setStatusMessage(`Abonnement étendu de ${nbMois} mois, nouvelle fin: ${formatterDate(data.abonnement.dateFin)}.`);
    };

    const handleAnnulerExtension = () => {
        setChoixExtensionOuvert(false);
        setStatusMessage("");
    };

    const handleResilier = async () => {
        const data = await lirePost<Record<string, never>, reponseActionAbonnement>("/client/abonnement/resilier", {});
        if (!data) return;
        if (!data.success || !data.abonnement) {
            setStatusMessage(data.reason || API_MESSAGES.UNKNOWN_ERROR);
            return;
        }

        setAbonnement(data.abonnement);
        setChoixSouscriptionOuvert(false);
        setChoixExtensionOuvert(false);
        setStatusMessage("Abonnement résilié.");
    };

    const nombreEmpruntsEnCours = empruntsActifs.length + empruntsEnRetard.length;
    const nombreEmpruntsAffiche = nombreEmpruntsCatalogue ?? nombreEmpruntsEnCours;
    const nombreRetardsAffiche = nombreRetardsCatalogue ?? empruntsEnRetard.length;
    const abonnementFini = abonnement.statut === "fini";

    return (
        <div className="client-panel">
            {
                activeMenu === "emprunts" ?
                    <section className="client-section">
                        <h2>Mes emprunts</h2>

                        <div className="client-group">
                            <h3>Emprunts actifs</h3>
                            {
                                empruntsActifs.length === 0 ?
                                    <p className="client-muted">Aucun emprunt actif.</p> :
                                    <ul className="client-emprunts-grid">
                                        {
                                            empruntsActifs.map(emprunt => (
                                                <li key={emprunt.id} className="client-emprunt-card">
                                                    <p className="client-emprunt-title">{emprunt.titreLivre}</p>
                                                    <p className="client-emprunt-meta">Début : {formatterDate(emprunt.dateDebut)}</p>
                                                    <p className="client-emprunt-meta">Retour prévu : {formatterDate(emprunt.dateRetourPrevue)}</p>
                                                </li>
                                            ))
                                        }
                                    </ul>
                            }
                        </div>
                        {
                            empruntsEnRetard.length === 0 ? null :
                                <div className="client-group">
                                    <h3>Attention ! à retourner au plus vite</h3>

                                    <ul className="client-emprunts-grid">
                                        {
                                            empruntsEnRetard.map(emprunt => (
                                                <li key={emprunt.id} className="client-emprunt-card client-emprunt-card-retard">
                                                    <p className="client-emprunt-title">{emprunt.titreLivre}</p>
                                                    <p className="client-emprunt-meta">Début : {formatterDate(emprunt.dateDebut)}</p>
                                                    <p className="client-emprunt-meta">Retour prévu : {formatterDate(emprunt.dateRetourPrevue)}</p>
                                                </li>
                                            ))
                                        }
                                    </ul>

                                </div>
                        }
                    </section> : activeMenu === "catalogue" ?
                        <section className="client-section">
                            <h2>Catalogue des livres de la bibliothéque</h2>
                            <p className="client-muted">Vous avez actuellement {nombreEmpruntsAffiche} emprunt(s) en cours.</p>
                            {
                                problemeActuelCatalogue !== "aucun" ?
                                    <div className="client-warning-block">
                                        <p className="client-warning-title">Vous pouvez pas faire plus d'emprunts</p>
                                        {
                                            problemeActuelCatalogue === "emprunts_en_retard" ?
                                                <p className="client-warning-text">
                                                    Vous avez {nombreRetardsAffiche} emprunt(s) en retard. Retournez-les avant tout nouvel emprunt.
                                                </p> : null
                                        }
                                        {
                                            problemeActuelCatalogue === "limite_emprunts_atteinte" ?
                                                <p className="client-warning-text">
                                                    Vous avez atteint la limite d'emprunts actifs ({nombreEmpruntsAffiche}).
                                                </p> : null
                                        }
                                    </div> : null
                            }

                            {
                                livresDisponibles.length === 0 ?
                                    <p className="client-muted">Aucun livre dans le catalogue.</p> :
                                    <ul className="client-catalogue-grid client-group">
                                        {
                                            livresDisponibles.map(livre => (
                                                <li key={livre.livreId} className="client-catalogue-card">
                                                    <p className="client-catalogue-title">{livre.titreLivre}</p>
                                                    <p className="client-catalogue-authors">
                                                        {livre.auteurs.length > 0 ? livre.auteurs.join(", ") : "Auteur inconnu"}
                                                    </p>
                                                    <p className="client-catalogue-availability">
                                                        {livre.exemplairesDisponibles} exemplaire(s) prenable(s)
                                                    </p>
                                                    <p className="client-catalogue-availability">
                                                        Empruntable: {livre.exemplairesDisponibles > 0 ? "Oui" : "Non"}
                                                    </p>
                                                </li>
                                            ))
                                        }
                                    </ul>
                            }
                        </section> :
                        <section className="client-section">
                            <h2>Mon abonnement</h2>

                            {
                                abonnement.statut === "actif" ?
                                    <div className="client-group">
                                        <p>Statut: <strong>Actif</strong></p>
                                        <p>Code série : <strong>{abonnement.codeSerie}</strong></p>
                                        <p>Date fin: <strong>{formatterDate(abonnement.dateFin)}</strong></p>

                                        <div className="client-actions-row">
                                            <button type="button" className="client-btn client-btn-success" onClick={handleEtendre}>Étendre</button>
                                            <button type="button" className="client-btn client-btn-danger" onClick={handleResilier}>Résilier</button>
                                        </div>

                                        {
                                            choixExtensionOuvert ?
                                                <div className="client-options-panel">
                                                    <p className="client-muted">Choisir une durée d'extension :</p>
                                                    <div className="client-actions-row">
                                                        <button type="button" className="client-btn client-btn-success" onClick={() => handleConfirmerExtension(1)}>+1 mois</button>
                                                        <button type="button" className="client-btn client-btn-success" onClick={() => handleConfirmerExtension(3)}>+3 mois</button>
                                                        <button type="button" className="client-btn client-btn-success" onClick={() => handleConfirmerExtension(6)}>+6 mois</button>
                                                        <button type="button" className="client-btn client-btn-success" onClick={() => handleConfirmerExtension(12)}>+12 mois</button>
                                                        <button type="button" className="client-btn" onClick={handleAnnulerExtension}>Annuler</button>
                                                    </div>
                                                </div> : null
                                        }
                                    </div> :
                                    <div className="client-group">
                                        {
                                            abonnementFini ?
                                                <>
                                                    <p>
                                                        Statut: <strong>Fini</strong>
                                                    </p>
                                                    <p>
                                                        Date fin: <strong>{formatterDate(abonnement.dateFin)}</strong>
                                                        <span className="client-abonnement-fini">Abonnement fini</span>
                                                    </p>
                                                </> :
                                                <p className="client-muted">Aucun abonnement actif.</p>
                                        }
                                        <button type="button" className="client-btn client-btn-success" onClick={handleSouscrire}>Souscrire</button>

                                        {
                                            choixSouscriptionOuvert ?
                                                <div className="client-options-panel">
                                                    <p className="client-muted">Choisir une durée de souscription :</p>
                                                    <div className="client-actions-row">
                                                        <button type="button" className="client-btn client-btn-success" onClick={() => handleConfirmerSouscription(1)}>1 mois</button>
                                                        <button type="button" className="client-btn client-btn-success" onClick={() => handleConfirmerSouscription(3)}>3 mois</button>
                                                        <button type="button" className="client-btn client-btn-success" onClick={() => handleConfirmerSouscription(6)}>6 mois</button>
                                                        <button type="button" className="client-btn client-btn-success" onClick={() => handleConfirmerSouscription(12)}>12 mois</button>
                                                        <button type="button" className="client-btn" onClick={handleAnnulerSouscription}>Annuler</button>
                                                    </div>
                                                </div> : null
                                        }
                                    </div>
                            }
                        </section>
            }

            {statusMessage.length > 0 ? <p className="client-status">{statusMessage}</p> : null}
        </div>
    );
}

export default ClientPage;
