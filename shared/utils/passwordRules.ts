export const PASSWORD_MAX_LENGTH = 100;

export function getPasswordRulesErrors(password: string): string[] {
    const errors: string[] = [];
    if (password.length > PASSWORD_MAX_LENGTH) errors.push("100 caractères maximum");
    if (password.length < 10) errors.push("10 caractères minimum");
    if (!/[A-Z]/.test(password)) errors.push("1 majuscule");
    if (!/\d/.test(password)) errors.push("1 chiffre");
    if (!/[#!?*]/.test(password)) errors.push("1 symbole spécial parmi # ! ? *");
    if (/[^A-Za-z0-9#!?*]/.test(password)) errors.push("symboles autorisés: # ! ? * uniquement");
    return errors;
}

export function isPasswordValid(password: string): boolean {
    return getPasswordRulesErrors(password).length === 0;
}
