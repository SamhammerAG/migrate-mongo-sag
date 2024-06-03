//https://www.mongodb.com/docs/drivers/node/current/compatibility/
//mongodb@6 breaks db.addUser, mongodb@4 still compatible with mongodb-server@6 & migrate-mongo@11

//https://github.com/seppevs/migrate-mongo?tab=readme-ov-file#api-usage
//use of api allows us to add new commdands (e.g. dropDatabase) and pre-processing (e.g. merge script direcitories)

//https://www.npmjs.com/package/@samhammer/vault-client-sag
//we may include this directly to replace placeholders or add support for config post-processing

//https://www.npmjs.com/package/dotenv#%EF%B8%8F-usage
//we my included this to configure our secrets in .env files and automatically put them to process.env

//https://www.npmjs.com/package/commander
//we use that to support actions before cli commands (same lib as migrate-mongo uses)
//we may add options for brand, environment (and instance app/admin) to make it unnecessary to have multiple config profiles

//https://github.com/seppevs/migrate-mongo/blob/master/lib/env/config.js#L66C36-L66C48
//we can use some logic to load some pre/post-processing scripts that are defined externally (see sample above)

import { create, database, config, up, down, status } from "migrate-mongo";
import { Command } from "commander";
import pkgjson from "../package.json";
import { loadEnv } from "./env";

const program = new Command();

program.name(pkgjson.name).description("CLI to migrate  mongodb").version(pkgjson.version);

program.hook("preSubcommand", async () => {
    loadEnv();
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
            migrationStatus.forEach((item) => console.log(`APPLIED: ${item.appliedAt} - ${item.fileName}`));
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
    .action(() => {
        console.log("TODO dropDatabase");
    });

program.parse();
