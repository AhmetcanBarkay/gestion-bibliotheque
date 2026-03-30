export const DEFAULT_BCRYPT_SALT_ROUNDS = 10;

export function getBcryptSaltRounds(): number {
    const rawValue = process.env.BCRYPT_SALT_ROUNDS?.trim();
    if (!rawValue) return DEFAULT_BCRYPT_SALT_ROUNDS;

    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed < 4 || parsed > 31) {
        return DEFAULT_BCRYPT_SALT_ROUNDS;
    }

    return parsed;
}
