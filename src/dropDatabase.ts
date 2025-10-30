import { type Db } from "mongodb";

export async function deleteDb(db: Db) {
    const userName = process.env.MongoDbOptions__UserName;
    const databaseName = db.databaseName;

    if (userName) {
        await db.removeUser(userName);
    }

    await db.dropDatabase();

    // return status about what was dropped
    return { databaseName, userName: userName ?? "" };
}
