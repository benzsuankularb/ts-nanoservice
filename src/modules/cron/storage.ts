import { Collection } from 'mongodb';

export interface CronSessionStorage {
  open(key: string): Promise<[time: number]>;
  close(key: string, time?: number): Promise<void>;
}

export class MemoryCronSessionStorage implements CronSessionStorage {
  _times: { [key: string]: number } = {};
  _opening: { [key: string]: boolean } = {};

  async open(key: string): Promise<[time: number]> {
    if (this._opening[key]) {
      throw `cron session ${key} already open'`;
    }
    this._opening[key] = true;
    const time = this._times[key] ?? 0;
    return [time];
  }

  async close(key: string, time?: number): Promise<void> {
    if (!this._opening[key]) {
      throw `cron session ${key} already closed'`;
    }
    if (time !== undefined) {
      this._times[key] = time;
    }
    this._opening[key] = true;
  }
}

interface MongoDoc {
  _id: string;
  time: number;
  open?: boolean;
}

export class MongoCronSessionStorage implements CronSessionStorage {
  collection: Collection<MongoDoc>;

  constructor(collection: Collection) {
    this.collection = collection as unknown as Collection<MongoDoc>;
  }

  async open(serviceId: string): Promise<[time: number]> {
    const result = await this.collection.findOneAndUpdate(
      {
        _id: serviceId,
        open: { $exists: false },
      },
      {
        $set: {
          open: true,
        },
        $setOnInsert: {
          time: 0,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    if (!result.ok) {
      throw `cron session ${serviceId} already open'`;
    }

    const time = result.value?.time ?? 0;
    return [time];
  }

  async close(serviceId: string, time?: number): Promise<void> {
    await this.collection.findOneAndUpdate(
      {
        _id: serviceId,
      },
      {
        open: { $unset: true },
        ...(time !== undefined ? { time } : {}),
      }
    );
  }
}
