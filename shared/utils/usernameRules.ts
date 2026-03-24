export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_ALLOWED_INPUT_REGEX = /^[A-Za-z_]*$/;

export function getUsernameRulesErrors(username: string): string[] {
    const errors: string[] = [];
    if (username.length > USERNAME_MAX_LENGTH) errors.push("30 caractères maximum");
    if (!/^[A-Za-z_]+$/.test(username)) errors.push("lettres alphabétiques et underscores uniquement");
    return errors;
}
