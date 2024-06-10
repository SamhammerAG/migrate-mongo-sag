import { config } from "migrate-mongo";
import path, { sep } from "path";
import { tmpdir } from "os";
import { mkdtemp, readdir, copyFile } from "fs/promises";
import { existsSync } from "fs";

export async function initMigrations() {
    if (!process.env.DefaultMigrations) throw new Error("enviroment variable DefaultMigrations is required");
    if (!process.env.Brand) throw new Error("enviroment variable Brand is required");

    const rootDir = await resolveMigrationsDirPath();
    const defaultDir = path.join(rootDir, process.env.DefaultMigrations);
    const brandDir = path.join(rootDir, process.env.Brand);

    const tempDir = await createMigrationsDir();
    await copyMigrationFiles(defaultDir, tempDir);
    await copyMigrationFiles(brandDir, tempDir);

    // config must be updated at last, cause resolveMigrationsDirPath must get rootDir from original config
    await updateConfig(tempDir);
}

export async function initCreateMigrations(defaultMigrations: boolean | undefined) {
    if (!process.env.DefaultMigrations) throw new Error("enviroment variable DefaultMigrations is required");

    const rootDir = await resolveMigrationsDirPath();
    const subDir = defaultMigrations || !process.env.Brand ? process.env.DefaultMigrations : process.env.Brand;
    const migrationDir = path.join(rootDir, subDir);

    // config must be updated at last, cause resolveMigrationsDirPath must get rootDir from original config
    await updateConfig(migrationDir);
}

async function createMigrationsDir() {
    const tempDir = await mkdtemp(`${tmpdir()}${sep}`);
    if (process.env.TRACE) console.log("created tempDir", tempDir);
    return tempDir;
}

async function updateConfig(migrationsDir: string) {
    const configContent = await config.read();
    configContent.migrationsDir = migrationsDir;
    config.set(configContent);
    if (process.env.TRACE) console.log("configured new migrationDir", migrationsDir);
}

async function copyMigrationFiles(srcDir: string, destinationDir: string) {
    if (!existsSync(srcDir)) {
        if (process.env.TRACE) console.log("sourceDir does not exist, skipping", srcDir);
        return;
    }

    let files = await readdir(srcDir, { withFileTypes: true });
    files = files.filter((file) => file.isFile());

    for (const file of files) {
        const srcFile = `${srcDir}${sep}${file.name}`;
        const destFile = `${destinationDir}${sep}${file.name}`;
        if (process.env.TRACE) console.log("copy file", srcFile, destFile);
        await copyFile(srcFile, destFile);
    }
}

async function resolveMigrationsDirPath() {
    const configContent = await config.read();
    const migrationsDir = configContent.migrationsDir;
    return path.isAbsolute(migrationsDir) ? migrationsDir : path.join(process.cwd(), migrationsDir);
}
