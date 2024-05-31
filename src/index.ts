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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { init, create, database, config, up, down, status } from "migrate-mongo";
import { Command } from "commander";

const program = new Command();

program.name("migrate-mongo").description("CLI to migrate  mongodb").version("0.0.1");

program
    .command("init")
    .description("initialize a new migration project")
    .action(() => {
        console.log("TODO init");
    });

program
    .command("create")
    .description("create a new database migration with the provided description")
    .action(() => {
        console.log("TODO create");
    });

program
    .command("up")
    .description("run all pending database migrations")
    .action(() => {
        // TODO merge migrationScripts and brandScripts
        console.log("TODO create");
    });

program
    .command("down")
    .description("undo the last applied database migration")
    .action(() => {
        // TODO merge migrationScripts and brandScripts
        console.log("TODO create");
    });

program
    .command("status")
    .description("print the changelog of the database")
    .action(() => {
        console.log("TODO create");
    });

program
    .command("dropDatabase")
    .description("deletes the database")
    .action(() => {
        console.log("TODO create");
    });

program.parse();
