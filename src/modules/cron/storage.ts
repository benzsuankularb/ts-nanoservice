import { Collection } from 'mongodb';

export interface CronStorage {
    set(key: string, time: number): Promise<void>;
    get(key: string): Promise<number>;
}

export class MemoryStorage implements CronStorage {
    _times: { [key: string]: number } = {};

    async set(key: string, time: number): Promise<void> {
        this._times[key] = time;
    }

    async get(key: string): Promise<number> {
        return this._times[key] ?? 0;
    }
}

interface MongoDoc {
    _id: string;
    time: number;
}

export class MongoStorage implements CronStorage {
    collection: Collection<MongoDoc>;

    constructor(collection: Collection) {
        this.collection = collection as unknown as Collection<MongoDoc>;
    }

    async set(key: string, time: number): Promise<void> {
        await this.collection.updateOne(
            { _id: `cron--${key}` },
            { time },
            { upsert: true }
        );
    }

    async get(key: string): Promise<number> {
        const doc = await this.collection.findOne({ _id: `cron--${key}` });
        return doc?.time ?? 0;
    }
}
