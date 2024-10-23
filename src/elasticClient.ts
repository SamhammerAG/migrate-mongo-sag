import { Client } from "@elastic/elasticsearch";
import fs from "fs";
import moment from "moment";
import readline from "readline";

export default class ElasticClient {
    private client = initElasticClient();

    public async syncLogValues() {
        if (!this.client) {
            return;
        }

        const fileStream = fs.createReadStream(process.env.Logger_LogFile);
        const lines = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const logs = [];
        for await (const line of lines) {
            logs.push(JSON.parse(line));
        }

        const indexName = `${process.env.Logger_ClientIndex}-${getIndexSuffix()}`;
        const body = logs.flatMap((log) => [{ index: { _index: indexName } }, log]);
        await this.client.bulk({ body });
    }
}

function getIndexSuffix() {
    const today = moment(Date.now());
    return `${today.year()}.${today.week()}`;
}

function initElasticClient() {
    if (!process.env.Logger_ClientUrl) {
        return null;
    }

    const client = new Client({
        node: process.env.Logger_ClientUrl,
        auth: {
            username: process.env.Logger_ClientUsername,
            password: process.env.Logger_ClientPassword
        }
    });

    return client;
}
