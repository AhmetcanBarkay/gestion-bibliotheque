import { createBibliothecaireUser, deleteBibliothecaireByUsername, generatePassword, getUsersByRole } from "./userService.js";

export async function createBibliothecaireAccount(username: string): Promise<{ status: "success" | "user_exists" | "error"; id?: number; generatedPassword?: string; }> {
    const generatedPassword = generatePassword(12);
    const result = await createBibliothecaireUser(username, generatedPassword);

    if (result.status !== "success" || !result.user) {
        return {
            status: result.status === "user_exists" ? "user_exists" : "error"
        };
    }

    return {
        status: "success",
        id: result.user.id,
        generatedPassword
    };
}

export async function deleteBibliothecaireAccount(username: string): Promise<"success" | "not_found" | "invalid_role" | "error"> {
    return deleteBibliothecaireByUsername(username);
}

export async function listBibliothecaires(): Promise<Array<{ id: number; username: string; date_created: string }>> {
    const users = await getUsersByRole("bibliothecaire");
    return users.map(user => ({
        id: user.id,
        username: user.username,
        date_created: user.date_created.toISOString()
    }));
}
