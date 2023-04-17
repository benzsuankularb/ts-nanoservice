/* eslint-disable @typescript-eslint/no-explicit-any */
import { Collection, MongoServerError, UpdateResult, WithId } from 'mongodb';
import { BaseService, ModuleRef, ServiceInterface, Start } from '../../../core';
import { Module } from '../module';
import { EntityComponentServiceInterface } from './entity-component';

type MongoDoc<T> = { _id: string; value: T };

export interface StringIDEntityComponent<T> {
    id: string;
    value: T;
}

export interface StringIDEntityComponentServiceOptions {
    index?: 'non-unique' | 'unique';
}

export class StringIDEntityComponentService<
    TServiceInf extends ServiceInterface &
        EntityComponentServiceInterface<T> = any,
    T = any
> extends BaseService<TServiceInf> {
    @ModuleRef<Module>('entity')
    private declare _module: Module;
    private declare _index?: 'non-unique' | 'unique';

    private declare _collection: Collection<MongoDoc<T>>;
    get collection(): Collection<MongoDoc<T>> {
        if (!this._collection) {
            this._collection = this._module.mongo.collection(this.id);
        }
        return this._collection;
    }

    constructor(options?: StringIDEntityComponentServiceOptions) {
        super();
        this._index = options?.index;
    }

    @Start()
    async _createIndexes(): Promise<void> {
        if (!this._index) {
            return;
        }

        const { collection } = this;
        collection.createIndexes([
            {
                key: {
                    value: 1
                },
                unique: this._index === 'unique'
            }
        ]);
    }

    protected _parseEntityComponent(
        doc: WithId<MongoDoc<T>>
    ): StringIDEntityComponent<T> {
        return {
            id: doc._id,
            value: doc.value
        };
    }

    protected async _get(id: string): Promise<T | undefined> {
        const { collection } = this;
        const doc = await collection.findOne({ _id: id });
        if (!doc) {
            return undefined;
        }

        return doc.value;
    }

    protected async _set(id: string, value: T | undefined): Promise<void> {
        const { collection } = this;
        const now = Date.now();

        if (!value) {
            const result = await collection.deleteOne({ _id: id });
            if (result.deletedCount > 0) {
                await this.emit('SETTED', { id, time: now, value } as any);
            }
            return;
        }

        let result: UpdateResult;
        try {
            result = await collection.updateOne(
                { _id: id },
                { $set: { value } },
                { upsert: true }
            );
        } catch (e) {
            if (e instanceof MongoServerError) {
                if (e.code === 11000) {
                    throw this.error('VALUE_NOT_UNIQUE', { value } as any);
                }
            }

            throw e;
        }

        if (result.modifiedCount + result.upsertedCount > 0) {
            await this.emit('SETTED', { id, time: now, value } as any);
        }
    }

    protected async _getByIds(ids: string[]): Promise<(T | undefined)[]> {
        const { collection } = this;
        const cursor = collection.find({ _id: { $in: ids as any } });
        const docs = await cursor.toArray();
        const docsById: { [id: string]: WithId<MongoDoc<T>> } = {};
        docs.forEach((doc) => (docsById[doc._id] = doc));

        return ids.map((id) => {
            const doc = docsById[id];
            if (!doc) {
                return undefined;
            }
            if (doc.value === undefined || doc.value === null) {
                return undefined;
            }
            return doc.value;
        });
    }

    protected async _getIdByValue(value: T): Promise<string | undefined> {
        const { collection } = this;
        const doc = await collection.findOne({ value: value as any });
        if (!doc) {
            return undefined;
        }
        return doc._id;
    }

    protected async _getIdsByValue(value: T): Promise<string[]> {
        const { collection } = this;
        const cursor = collection.find({ value: value as any });
        const docs = await cursor.toArray();
        return docs.map((doc) => doc._id);
    }

    protected async _getAll(): Promise<StringIDEntityComponent<T>[]> {
        const { collection } = this;
        const cursor = collection.find({});
        const docs = await cursor.toArray();
        return docs.map((doc) => this._parseEntityComponent(doc));
    }
}
