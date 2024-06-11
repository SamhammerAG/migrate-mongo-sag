# migrate-mongo-sag

migrate-mongo-sag is a database migration tool for MongoDB running in Node.js<br>
it provides some additional functionality to the original migrate-mongo https://github.com/seppevs/migrate-mongo

this tool additionally supports:

-   execution of migration-scripts for "brand" and "default" (will be merged)
-   new options to set "brand", "env" and "suffix" as environment variables
-   new command "dropDatabase" to delete the configured database
-   load settings from .env files by https://github.com/motdotla/dotenv
-   load vault secrets defined in .env files https://github.com/SamhammerAG/vault-client-sag

## Requirements

-   yarn 4.x
-   node 18.x

## Installation

`$ yarn add @samhammer/migrate-mongo-sag`

## CLI Usage

```
$ yarn run migrate-mongo
Usage: migrate-mongo [options] [command]

CLI to migrate mongodb

Options:
  -V, --version                   output the version number
  -e, --env <env>                 set process.env.Environment
  -b, --brand <brand>             set process.env.Brand
  -s, --suffix <suffix>           set process.env.Suffix
  -t, --trace                     set process.env.TRACE to enable trace outputs
  -h, --help                      display help for command

Commands:
  create [options] [description]  create a new database migration with the provided description
  up                              run all pending database migrations
  down                            undo the last applied database migration
  status                          print the changelog of the database
  dropDatabase                    deletes the database
  help [command]                  display help for command
```

## Basic Setup

-   create a ".env" file and ".env.local" (optional) file
-   create a "migrate-mongo.config.js" file
-   create a "migrations" directory
    -   create sub-directory "default"
    -   create sub-directory per "brand"
    -   place a sample-migration.js in "default" and "brand" directories (optional)

#### sample .env

this should be used to define settings for all environments and secret keys

```
#setup directory name for default migrations (mandatory)
DefaultMigrations="default"

#setup vault secret for user name + password (optional)
MongoDbOptions__AdminUserName="VaultKey--kv-v2/data/mongodb/Username"
MongoDbOptions__AdminPassword="VaultKey--kv-v2/data/mongodb/Password"

#setup url for mongodb which can then be used in migrate-mongo-config.js (optional)
MongoDb__Url="mongodb://$MongoDbOptions__AdminUserName:$MongoDbOptions__AdminPassword@$MongoDbOptions__DatabaseHost"
```

#### sample .env.local

this should be used to define settings for local development only

```
#setup host for mongodb to be used as placeholder in mongodb url (optional)
MongoDbOptions__DatabaseHost="localhost:27017"

#setup defaults for environment and brand; can still be overwritten by cli with "--env" and "--brand" (optional)
Environment=dev
Brand=myBrand
```

#### sample migrate-mongo.config.js

with this config we can map settings defined in environment for migrate-mongo<br>
we can access settings defined in environment variables or .env files by process.env

```js
/** @type {import("migrate-mongo").config.Config} */
module.exports = {
    mongodb: {
        // Change (or review) the url to your MongoDB:
        url: `${process.env.MongoDb__Url}`,

        // Change this to your database name
        databaseName: "my-database"
    },

    // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
    migrationsDir: "migrations",

    // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
    changelogCollectionName: "migrations",

    // The file extension to create migrations and search for in migration dir
    migrationFileExtension: ".js",

    // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
    // if the file should be run.  Requires that scripts are coded to be run multiple times.
    useFileHash: false,

    // Change moduleSystem for migration files. Supported values are "commonjs" and "esm".
    moduleSystem: "commonjs"
};
```
