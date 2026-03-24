import React, { useState } from "react";
import './Authentication.css';
import Button from "../ui/Button";
import Input from "../ui/Input";
import { apiHelper } from "../../api/apiHelper";
import type { loginBody, loginResponse, registerBody, registerResponse } from "@shared/types/api/authApi.js";
interface AuthentificationProps {
    setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>
}

function Authentification(props: AuthentificationProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState(new Set<string>());
    const [errorMessage, setErrorMessage] = useState("");

    const getPasswordError = (value: string): string | null => {
        if (value.length === 0) return "Mot de passe requis";
        if (mode === "login") return null;

        const rules: string[] = [];
        if (value.length < 10) rules.push("10 caractères minimum");
        if (!/[A-Z]/.test(value)) rules.push("1 majuscule");
        if (!/\d/.test(value)) rules.push("1 chiffre");
        if (!/[^A-Za-z0-9]/.test(value)) rules.push("1 symbole spécial");

        return rules.length === 0 ? null : `Votre mot de passe dois avoir :\n- ${rules.join("\n- ")}`;
    };

    const switchMode = (newMode: "login" | "register") => {
        setMode(newMode);
        setErrorMessage("");
        if (newMode === "login") {
            setConfirmPassword("");
            setErrors(prev => {
                const next = new Set(prev);
                next.delete("confirmPassword");
                return next;
            });
        }
    };

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

    const handleRegister = async (setIsLoading: (loading: boolean) => void) => {
        setIsLoading(true);
        setErrorMessage("");

        await apiHelper.post<registerBody, registerResponse>("/auth/register", { username, password, confirmPassword })
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

    const submitLabel = mode === "login" ? "Se connecter" : "Créer un compte";
    const submitHandler = mode === "login" ? handleLogin : handleRegister;
    const toggleLabel = mode === "login" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Retour à la connexion";

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
                    onCheck={getPasswordError}
                />
                {
                    mode === "register" ?
                        <Input
                            type="password"
                            label="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            onToggleError={handleToggleError("confirmPassword")}
                            validationDeps={[password, mode]}
                            onCheck={(v) => {
                                if (mode !== "register") return null;
                                return v !== password ? `Les mots de passe doivent être identiques` : null;
                            }}
                        /> : null
                }
            </div>
            <p className="error-text-authentification">{errorMessage.length === 0 ? "\u00A0" : errorMessage}</p>
            <Button
                onClick={submitHandler}
                disabled={errors.size > 0}
                style={{ marginTop: "10px" }}
            >
                {submitLabel}
            </Button>
            <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => {
                    switchMode(mode === "login" ? "register" : "login");
                }}
            >
                {toggleLabel}
            </button>
        </div >
    );
};


export default Authentification;