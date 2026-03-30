export const PASSWORD_MAX_LENGTH = 100;

export function getPasswordRulesErrors(password: string): string[] {
    const errors: string[] = [];
    if (password.length > PASSWORD_MAX_LENGTH) errors.push("100 caractères maximum");
    if (password.length < 10) errors.push("10 caractères minimum");
    if (!/\p{Lu}/u.test(password)) errors.push("1 majuscule");
    if (!/\p{Nd}/u.test(password)) errors.push("1 chiffre");
    if (!/[^\p{L}\p{N}\s]/u.test(password)) errors.push("1 caractère spécial");
    return errors;
}

export function isPasswordValid(password: string): boolean {
    return getPasswordRulesErrors(password).length === 0;
}
