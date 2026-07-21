import { Client } from "@elastic/elasticsearch";
import { format } from "date-fns";
import fs from "fs";
import readline from "readline";
import { getLogFile } from "./logger";

export default class ElasticClient {
    private client = initElasticClient();

    public async syncLogValues() {
        if (!this.client) {
            return;
        }

        const fileStream = fs.createReadStream(getLogFile());
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

export function getIndexSuffix() {
    // ISO 8601 week-date: RRRR = ISO week-year, I = ISO week (un-padded), e.g. "2026.1".
    return format(new Date(), "RRRR.I");
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
