import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const testsRoot = resolve(scriptDir, "..", "tests");
const extraArgs = process.argv.slice(2);

async function initializeDatabaseBeforeTests(): Promise<void> {
    try {
        const db = await import("../db/initDatabase.js");
        await db.initDatabase();
        await db.closeDatabase();
    } catch (error) {
        console.error("Impossible d'initialiser la base avant les tests:", error);
        process.exit(1);
    }
}

function collectTestFiles(directory: string): string[] {
    const entries = readdirSync(directory);
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = join(directory, entry);
        const stats = statSync(fullPath);

        if (stats.isDirectory()) {
            files.push(...collectTestFiles(fullPath));
            continue;
        }

        if (entry.endsWith(".test.ts")) {
            files.push(fullPath);
        }
    }

    return files;
}

async function main(): Promise<void> {
    let testFiles: string[] = [];

    try {
        testFiles = collectTestFiles(testsRoot).sort((a, b) => a.localeCompare(b));
    } catch (error) {
        console.error("Impossible de lire le dossier tests:", error);
        process.exit(1);
    }

    if (testFiles.length === 0) {
        console.error("Aucun fichier de test trouve dans le dossier tests");
        process.exit(1);
    }

    await initializeDatabaseBeforeTests();

    const hasConcurrencyArg = extraArgs.some(arg => arg.startsWith("--test-concurrency"));
    const nodeTestArgs = ["--import", "tsx", "--test"];

    if (!hasConcurrencyArg) {
        nodeTestArgs.push("--test-concurrency=1");
    }

    nodeTestArgs.push(...extraArgs, ...testFiles);

    const result = spawnSync(
        process.execPath,
        nodeTestArgs,
        {
            stdio: "inherit",
            shell: false
        }
    );

    if (result.error) {
        console.error("Impossible de lancer les tests:", result.error.message);
        process.exit(1);
    }

    process.exit(result.status ?? 1);
}

void main();
