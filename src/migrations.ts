import { config } from "migrate-mongo";
import path, { sep } from "path";
import { readdir, copyFile, rm } from "fs/promises";
import { existsSync, mkdirSync } from "fs";

export async function initMigrations() {
    if (!process.env.DefaultMigrationsDir) throw new Error("enviroment variable DefaultMigrationsDir is required");
    if (!process.env.Brand) throw new Error("enviroment variable Brand is required");

    const rootDir = await resolveMigrationsDirPath();
    const defaultDir = path.join(rootDir, process.env.DefaultMigrationsDir);
    const brandDir = path.join(rootDir, process.env.Brand);

    const tempDir = await initTempDir();
    await copyMigrationFiles(defaultDir, tempDir);
    await copyMigrationFiles(brandDir, tempDir);

    // config must be updated at last, cause resolveMigrationsDirPath must get rootDir from original config
    await updateConfig(tempDir);
}

export async function initCreateMigrations(useDefaultMigrations: boolean | undefined) {
    if (useDefaultMigrations && !process.env.DefaultMigrationsDir) throw new Error("enviroment variable DefaultMigrationsDir is required");
    if (!useDefaultMigrations && !process.env.Brand) throw new Error("enviroment variable Brand is required");

    const subDir = useDefaultMigrations ? process.env.DefaultMigrationsDir : process.env.Brand;
    const rootDir = await resolveMigrationsDirPath();
    const migrationDir = path.join(rootDir, subDir);

    // config must be updated at last, cause resolveMigrationsDirPath must get rootDir from original config
    await updateConfig(migrationDir);
}

async function initTempDir() {
    const tempDir = await createTempDir();
    await cleanupTempDir(tempDir);
    return tempDir;
}

async function createTempDir() {
    const tempDir = path.join(process.cwd(), ".temp");

    if (!existsSync(tempDir)) {
        mkdirSync(tempDir);
        if (process.env.TRACE) console.log("created tempDir", tempDir);
    } else {
        if (process.env.TRACE) console.log("using tempDir", tempDir);
    }

    return tempDir;
}

async function cleanupTempDir(tempDir: string) {
    const files = await readdir(tempDir, { withFileTypes: true });

    for (const file of files) {
        const filePath = path.join(tempDir, file.name);
        if (process.env.TRACE) console.log("remove tempFile", filePath);
        await rm(filePath);
    }

    if (process.env.TRACE) console.log("cleaned up tempDir", tempDir);
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
