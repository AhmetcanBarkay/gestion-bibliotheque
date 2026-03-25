import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/user";
const users: User[] = [];

export function getUserByToken(token: string): User | undefined {
    return users.find(u => u.token === token);
}

export function generateToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    const len = chars.length;
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(crypto.randomInt(0, len));
    };
    return token;
};

export function generatePassword(length: number = 12): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const specials = "!@#$%^&*()-_=+[]{}";
    const all = uppercase + lowercase + digits + specials;

    const chars: string[] = [
        uppercase.charAt(crypto.randomInt(0, uppercase.length)),
        lowercase.charAt(crypto.randomInt(0, lowercase.length)),
        digits.charAt(crypto.randomInt(0, digits.length)),
        specials.charAt(crypto.randomInt(0, specials.length))
    ];

    for (let i = chars.length; i < length; i++) {
        chars.push(all.charAt(crypto.randomInt(0, all.length)));
    }

    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        const temp = chars[i];
        chars[i] = chars[j];
        chars[j] = temp;
    }

    return chars.join("");
};

export function getUserByUsername(username: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
        resolve(users.find(u => u.username === username))
    });
};

export function getUserByLogin(username: string, password: string): Promise<User | undefined> {
    return new Promise(async (resolve, reject) => {
        const user = await getUserByUsername(username);
        if (!user) return resolve(undefined);
        bcrypt.compare(password, user.hashedPassword, (err, result) => {
            if (err) return reject(err);
            if (result) return resolve(user);
            resolve(undefined);
        });
    });
};

type createUserResponse = "success" | "user_exists" | "error";
interface createUserResult {
    status: createUserResponse;
    user?: User;
};
export function createUser(username: string, password: string, role: User['role']): Promise<createUserResult> {
    return new Promise(async (resolve, reject) => {

        //check before attempting to create
        if (await getUserByUsername(username)) return resolve({ status: "user_exists" });
        try {
            bcrypt.hash(password, 10, async (err, hash) => {
                if (err) return resolve({ status: "error" });

                //check if another user with the same name has been created while waiting for the hash
                if (await getUserByUsername(username)) return resolve({ status: "user_exists" });

                const newUser = {
                    id: users.length + 1,
                    username,
                    hashedPassword: hash,
                    token: generateToken(),
                    role,
                    date_created: new Date()
                };
                users.push(newUser);
                resolve({ status: "success", user: newUser });
            });
        } catch {
            resolve({ status: "error" });
        };
    });
};

export function registerClientUser(username: string, password: string): Promise<createUserResult> {
    return createUser(username, password, "client");
};

export function createBibliothecaireUser(username: string, password: string): Promise<createUserResult> {
    return createUser(username, password, "bibliothecaire");
};

type deleteUserResult = "success" | "not_found" | "error";
export function deleteUserById(id: number): Promise<deleteUserResult> {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return Promise.resolve("not_found");
    users.splice(index, 1);
    return Promise.resolve("success");
};

export function getUsersByRole(role: User['role']): Promise<User[]> {
    return new Promise((resolve, reject) => {
        resolve(users.filter(u => u.role === role));
    });
};
createUser("admin", "12345678", "admin"); //TEMPORAIRE,  A CHANGER PLUS TARD