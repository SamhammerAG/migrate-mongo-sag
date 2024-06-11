/** @type {import("migrate-mongo").config.Config} */
module.exports = {
    mongodb: {
        // Change (or review) the url to your MongoDB:
        url: `${process.env.MongoDb__Url}`,

        // Change this to your database name
        databaseName: "migrate-mongo",

        // Set options for MongoDB client
        options: {
            // removes a deprecation warning when connecting
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
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
