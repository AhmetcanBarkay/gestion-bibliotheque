type ServiceUtilisateur = {
    getUserByUsername: (username: string) => Promise<{ id: number } | undefined>;
    deleteUserById: (id: number) => Promise<unknown>;
};

type ServiceBibliothecaire = {
    listerEmpruntsClient: (clientUserId: number) => Promise<{
        empruntsActifs: Array<{ id: number }>;
        empruntsEnRetard: Array<{ id: number }>;
    }>;
    confirmerRetourEmprunt: (empruntId: number) => Promise<unknown>;
};

export function genererNomUnique(prefix: string, maxLength: number = 45): string {
    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 100000).toString(36)}`;
    const trimmedPrefix = prefix.slice(0, Math.max(1, maxLength - suffix.length - 1));
    return `${trimmedPrefix}_${suffix}`;
}

export async function nettoyerUtilisateurParNom(service: ServiceUtilisateur, username: string): Promise<void> {
    const existing = await service.getUserByUsername(username);
    if (existing) {
        await service.deleteUserById(existing.id).catch(() => undefined);
    }
}

export async function nettoyerEmpruntsClient(
    service: ServiceBibliothecaire,
    clientUserId?: number
): Promise<void> {
    if (!clientUserId) return;

    const emprunts = await service.listerEmpruntsClient(clientUserId).catch(() => undefined);
    if (!emprunts) return;

    for (const emprunt of [...emprunts.empruntsActifs, ...emprunts.empruntsEnRetard]) {
        await service.confirmerRetourEmprunt(emprunt.id).catch(() => undefined);
    }
}
