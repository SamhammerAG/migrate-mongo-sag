#! /usr/bin/env node

import { create, database, config, up, down, status } from "migrate-mongo";
import { Command } from "commander";
import pkgjson from "../package.json";
import { loadEnv } from "./env";
import { deleteDb } from "./dropDatabase";

const program = new Command();

program
    .name("migrate-mongo")
    .description("CLI to migrate mongodb")
    .version(pkgjson.version)
    .option("-e, --env <env>", "set process.env.Environment")
    .option("-b, --brand <brand>", "set process.env.Brand")
    .option("-s, --suffix <suffix>", "set process.env.Suffix");

program.hook("preSubcommand", async (cmd) => {
    await loadEnv(cmd);
});

program
    .command("create [description]")
    .description("create a new database migration with the provided description")
    .action(async (description) => {
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
        const { db, client } = await database.connect();

        try {
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
        const { db, client } = await database.connect();

        try {
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
        const { db, client } = await database.connect();

        try {
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
