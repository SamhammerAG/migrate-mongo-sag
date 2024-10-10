#! /usr/bin/env node

import { create, database, config, up, down, status } from "migrate-mongo";
import { Command } from "commander";
import pkgjson from "../package.json";
import { initEnv } from "./env";
import { deleteDb } from "./dropDatabase";
import { initCreateMigrations, initMigrations } from "./migrations";
import { sep } from "path";
import { initLogger } from "./logger";
import type { Logger } from "winston";
import ElasticClient from "./elasticClient";

const program = new Command();
let logger: Logger;
let elasticClient: ElasticClient;

program
    .name("migrate-mongo")
    .description("CLI to migrate mongodb")
    .version(pkgjson.version)
    .option("-e, --env <env>", "set process.env.Environment")
    .option("-b, --brand <brand>", "set process.env.Brand")
    .option("-a, --app <app>", "set process.env.App")
    .option("-t, --trace", "set process.env.TRACE to enable trace outputs");

program.hook("preSubcommand", async (cmd) => {
    process.env.TRACE = cmd.getOptionValue("trace") ? "on" : "";
    if (process.env.TRACE) console.log("hook pre-command...");
    await initEnv(cmd);
    logger = initLogger();
    elasticClient = new ElasticClient();
});

program
    .command("create [description]")
    .description("create a new database migration with the provided description")
    .option("-d, --default", "enforce creation in defaultMigration folder")
    .action(async (description, args) => {
        if (process.env.TRACE) logger.info("run command create...");

        try {
            await initCreateMigrations(args.default);
            const fileName = await create(description);
            const configuration = await config.read();
            logger.info(`CREATED: ${configuration.migrationsDir}${sep}${fileName}`);
        } catch (error) {
            logger.error(`ERROR: ${error.message}`, error.stack);
            await elasticClient.syncLogValues();
            process.exit(1);
        }
    });

program
    .command("up")
    .description("run all pending database migrations")
    .action(async () => {
        if (process.env.TRACE) logger.info("run command up...");

        const { db, client } = await database.connect();

        try {
            await initMigrations();
            const migrated = await up(db, client);
            migrated.forEach((fileName) => logger.info(`MIGRATED UP: ${fileName}`));
            logger.info("Completed migration");
        } catch (error) {
            logger.error(`ERROR: ${error.message}`, error.stack);
            error.migrated.forEach((fileName) => logger.error(`MIGRATED UP: ${fileName}`));
        } finally {
            await elasticClient.syncLogValues();
            await client.close();
            process.exit(1);
        }
    });

program
    .command("down")
    .description("undo the last applied database migration")
    .action(async () => {
        if (process.env.TRACE) logger.info("run command down...");

        const { db, client } = await database.connect();

        try {
            await initMigrations();
            const migratedDown = await down(db, client);
            migratedDown.forEach((fileName) => logger.info(`MIGRATED DOWN: ${fileName}`));
        } catch (error) {
            logger.error(`ERROR: ${error.message}`, error.stack);
            process.exit(1);
        } finally {
            await elasticClient.syncLogValues();
            await client.close();
        }
    });

program
    .command("status")
    .description("print the changelog of the database")
    .action(async () => {
        if (process.env.TRACE) logger.info("run command status...");

        const { db, client } = await database.connect();

        try {
            await initMigrations();
            const migrationStatus = await status(db);
            migrationStatus.forEach((item) => logger.info(`${item.appliedAt}: ${item.fileName}`));
        } catch (error) {
            logger.error(`ERROR: ${error.message}`, error.stack);
            process.exit(1);
        } finally {
            await elasticClient.syncLogValues();
            await client.close();
        }
    });

program
    .command("dropDatabase")
    .description("deletes the database")
    .action(async () => {
        if (process.env.TRACE) logger.info("run command dropDatabase...");

        const { db, client } = await database.connect();

        try {
            const deleteStatus = await deleteDb(db);
            logger.info(`DROPPED DB:`, deleteStatus.databaseName, deleteStatus.userName);
        } catch (error) {
            logger.error(`ERROR: ${error.message}`, error.stack);
        } finally {
            await elasticClient.syncLogValues();
            await client.close();
            process.exit(1);
        }
    });

program.parse();
