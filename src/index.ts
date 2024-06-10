#! /usr/bin/env node

import { create, database, config, up, down, status } from "migrate-mongo";
import { Command } from "commander";
import pkgjson from "../package.json";
import { initEnv } from "./env";
import { deleteDb } from "./dropDatabase";
import { initMigrations } from "./migrations";

const program = new Command();

program
    .name("migrate-mongo")
    .description("CLI to migrate mongodb")
    .version(pkgjson.version)
    .option("-e, --env <env>", "set process.env.Environment")
    .option("-b, --brand <brand>", "set process.env.Brand")
    .option("-s, --suffix <suffix>", "set process.env.Suffix")
    .option("-d, --debug", "enable debug output");

program.hook("preSubcommand", async (cmd) => {
    process.env.DEBUG = cmd.getOptionValue("debug") ? "on" : "";
    if (process.env.DEBUG) console.log("hook pre-command...");
    await initEnv(cmd);
});

program
    .command("create [description]")
    .description("create a new database migration with the provided description")
    .action(async (description) => {
        if (process.env.DEBUG) console.log("run command create...");

        try {
            const fileName = create(description);
            const configuration = await config.read();
            console.log(`CREATED: ${configuration.migrationsDir}/${fileName}`);
        } catch (error) {
            console.error(`ERROR: ${error.message}`, error.stack);
            process.exit(1);
        }
    });

program
    .command("up")
    .description("run all pending database migrations")
    .action(async () => {
        if (process.env.DEBUG) console.log("run command up...");

        const { db, client } = await database.connect();

        try {
            await initMigrations();
            const migrated = await up(db, client);
            migrated.forEach((fileName) => console.log(`MIGRATED UP: ${fileName}`));
        } catch (error) {
            console.error(`ERROR: ${error.message}`, error.stack);
            error.migrated.forEach((fileName) => console.log(`MIGRATED UP: ${fileName}`));
            process.exit(1);
        } finally {
            await client.close();
        }
    });

program
    .command("down")
    .description("undo the last applied database migration")
    .action(async () => {
        if (process.env.DEBUG) console.log("run command down...");

        const { db, client } = await database.connect();

        try {
            await initMigrations();
            const migratedDown = await down(db, client);
            migratedDown.forEach((fileName) => console.log(`MIGRATED DOWN: ${fileName}`));
        } catch (error) {
            console.error(`ERROR: ${error.message}`, error.stack);
            process.exit(1);
        } finally {
            await client.close();
        }
    });

program
    .command("status")
    .description("print the changelog of the database")
    .action(async () => {
        if (process.env.DEBUG) console.log("run command status...");

        const { db, client } = await database.connect();

        try {
            await initMigrations();
            const migrationStatus = await status(db);
            migrationStatus.forEach((item) => console.log(`${item.appliedAt}: ${item.fileName}`));
        } catch (error) {
            console.error(`ERROR: ${error.message}`, error.stack);
            process.exit(1);
        } finally {
            await client.close();
        }
    });

program
    .command("dropDatabase")
    .description("deletes the database")
    .action(async () => {
        if (process.env.DEBUG) console.log("run command dropDatabase...");

        const { db, client } = await database.connect();

        try {
            const deleteStatus = await deleteDb(db);
            console.log(`DROPPED DB:`, deleteStatus.databaseName, deleteStatus.userName);
        } catch (error) {
            console.error(`ERROR: ${error.message}`, error.stack);
            process.exit(1);
        } finally {
            await client.close();
        }
    });

program.parse();
