module.exports = {
    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} client
     */
    async up(db, client) {
        await db.collection("sampleData").insertOne({ FirstName: "Garfield" });
        await db.collection("sampleData").insertOne({ FirstName: "Odyn" });
    },

    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} client
     */
    async down(db, client) {
        await db.collection("sampleData").deleteOne({ FirstName: "Garfield" });
        await db.collection("sampleData").deleteOne({ FirstName: "Odyn" });
    }
};
