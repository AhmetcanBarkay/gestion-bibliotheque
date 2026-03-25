import { createBibliothecaireUser, deleteUserById, generatePassword, getUserByUsername, getUsersByRole } from "./userService.js";

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

export async function deleteBibliothecaireAccount(username: string): Promise<"success" | "not_found" | "wrong_role"> {
    const result = await getUserByUsername(username);
    if (!result) {
        return "not_found";
    };
    if (result.role !== "bibliothecaire") {
        return "wrong_role";
    };
    await deleteUserById(result.id);
    return "success"
}

export async function listBibliothecaires(): Promise<Array<{ id: number; username: string; date_created: string }>> {
    const users = await getUsersByRole("bibliothecaire");
    return users.map(user => ({
        id: user.id,
        username: user.username,
        date_created: user.date_created.toISOString()
    }));
}
