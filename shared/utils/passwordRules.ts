export function getPasswordRulesErrors(password: string): string[] {
    const errors: string[] = [];
    if (password.length < 10) errors.push("10 caractères minimum");
    if (!/[A-Z]/.test(password)) errors.push("1 majuscule");
    if (!/\d/.test(password)) errors.push("1 chiffre");
    if (!/[^A-Za-z0-9]/.test(password)) errors.push("1 symbole spécial");
    return errors;
}
