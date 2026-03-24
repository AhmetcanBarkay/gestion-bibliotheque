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
createUser("admin", "12345678", "admin"); //TEMPORAIRE,  A CHANGER PLUS TARD