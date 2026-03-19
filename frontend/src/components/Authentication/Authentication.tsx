import React, { useState } from "react";
import './Authentication.css';
import Button from "../ui/Button";
import Input from "../ui/Input";
import { apiHelper } from "../../api/apiHelper";
import type { loginBody, loginResponse } from "@shared/types/api/authApi.js";
interface AuthentificationProps {
    setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>
}

function Authentification(props: AuthentificationProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState(new Set<string>());
    const [errorMessage, setErrorMessage] = useState("");
    const handleToggleError = (id: string) => (hasError: boolean) => {
        setErrors(prev => {
            const newSet = new Set(prev);
            hasError ? newSet.add(id) : newSet.delete(id);
            return newSet;
        });
    };

    const handleLogin = async (setIsLoading: (loading: boolean) => void) => {
        setIsLoading(true);
        setErrorMessage("");

        await apiHelper.post<loginBody, loginResponse>("/auth/login", { username, password })
            .then(res => {
                const apiResponse = res.data;
                if (!apiResponse) {
                    return setErrorMessage("Réponse invalide du serveur");
                };

                if (apiResponse.success && apiResponse.token) {
                    localStorage.setItem("token", apiResponse.token);
                    props.setLoggedIn(true);
                } else {
                    setErrorMessage(apiResponse.reason || "Erreur inconnue");
                };
            });

        setIsLoading(false);

    };

    return (
        <div id="authentification" className="center">
            <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
                <Input
                    label="Nom d'utilisateur"
                    value={username}
                    onChange={setUsername}
                    onToggleError={handleToggleError("username")}
                    onCheck={(v) => v.length === 0 ? "Nom d'utilisateur requis" : null}
                />
                <Input
                    type="password"
                    label="Mot de passe"
                    value={password}
                    onChange={setPassword}
                    onToggleError={handleToggleError("password")}
                    onCheck={(v) => v.length < 8 ? "Mot de passe court (min 8 caractères)" : null}
                />
            </div>
            <p className="error-text-authentification">{errorMessage.length === 0 ? "\u00A0" : errorMessage}</p>
            <Button
                onClick={handleLogin}
                disabled={errors.size > 0}
                style={{ marginTop: "10px" }}
            >
                Se connecter
            </Button>
        </div >
    );
};


export default Authentification;