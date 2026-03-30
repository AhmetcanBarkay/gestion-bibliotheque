import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const testsRoot = resolve(scriptDir, "..", "tests");
const extraArgs = process.argv.slice(2);

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

const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--test", ...extraArgs, ...testFiles],
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
