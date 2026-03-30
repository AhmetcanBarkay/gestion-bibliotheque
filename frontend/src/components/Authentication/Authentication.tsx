import { useState } from "react";
import './Authentication.css';
import Button from "../ui/Button";
import Input from "../ui/Input";
import { apiHelper } from "../../api/apiHelper";
import type { loginBody, loginResponse, registerBody, registerResponse } from "@shared/types/api/authApi.js";
import type { Role } from "@shared/types/roles.js";
import { getPasswordRulesErrors, PASSWORD_MAX_LENGTH } from "@shared/utils/passwordRules.js";
import { getUsernameRulesErrors, USERNAME_ALLOWED_INPUT_REGEX, USERNAME_MAX_LENGTH } from "@shared/utils/usernameRules.js";
interface AuthentificationProps {
    onAuthSuccess: (session: { role: Role, username: string }) => void;
}

function Authentification(props: AuthentificationProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState(new Set<string>());
    const [errorMessage, setErrorMessage] = useState("");

    const handleUsernameChange = (value: string) => {
        if (value.length > USERNAME_MAX_LENGTH) return;
        if (!USERNAME_ALLOWED_INPUT_REGEX.test(value)) return;
        setUsername(value);
    };

    const handlePasswordChange = (value: string) => {
        if (value.length > PASSWORD_MAX_LENGTH) return;
        setPassword(value);
    };

    const handleConfirmPasswordChange = (value: string) => {
        if (value.length > PASSWORD_MAX_LENGTH) return;
        setConfirmPassword(value);
    };

    const getPasswordError = (value: string): string | null => {
        if (value.length === 0) return "Mot de passe requis";
        if (mode === "login") {
            return value.length > 100 ? "Mot de passe trop long (max 100 caractères)" : null;
        }

        const rules = getPasswordRulesErrors(value);

        return rules.length === 0 ? null : `Votre mot de passe doit avoir :\n- ${rules.join("\n- ")}`;
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
                    props.onAuthSuccess({
                        role: apiResponse.role || "client",
                        username: apiResponse.username || username
                    });
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
                    props.onAuthSuccess({
                        role: apiResponse.role || "client",
                        username: apiResponse.username || username
                    });
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
            <img className="auth-logo" src="/logo.png" alt="Logo bibliothèque" />
            <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
                <Input
                    label="Nom d'utilisateur"
                    value={username}
                    onChange={handleUsernameChange}
                    onToggleError={handleToggleError("username")}
                    maxLength={USERNAME_MAX_LENGTH}
                    onCheck={(v) => {
                        if (v.length === 0) return "Nom d'utilisateur requis";
                        const rules = getUsernameRulesErrors(v);
                        return rules.length === 0 ? null : `Nom d'utilisateur invalide:\n- ${rules.join("\n- ")}`;
                    }}
                />
                <Input
                    type="password"
                    label="Mot de passe"
                    value={password}
                    onChange={handlePasswordChange}
                    onToggleError={handleToggleError("password")}
                    maxLength={PASSWORD_MAX_LENGTH}
                    onCheck={getPasswordError}
                />
                {
                    mode === "register" ?
                        <Input
                            type="password"
                            label="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            onToggleError={handleToggleError("confirmPassword")}
                            maxLength={PASSWORD_MAX_LENGTH}
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