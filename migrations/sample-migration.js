module.exports = {
    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} client
     */
    async up(db, client) {
        // TODO write your migration here.
        // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
        // Example:
        // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    },

    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} client
     */
    async down(db, client) {
        // TODO write the statements to rollback your migration (if possible)
        // Example:
        // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    }
};
