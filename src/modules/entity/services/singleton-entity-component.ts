/* eslint-disable @typescript-eslint/no-explicit-any */
import { Collection } from 'mongodb';
import { BaseService, ModuleRef, ServiceInterface } from '../../../core';
import { Module } from '../module';

type MongoDoc<T> = {
    _id: string;
    value?: T;
};

interface SingletonEntityComponentServiceInterface_Functions<T> {
    get(): Promise<T | undefined>;
}

export type SingletonEntityComponentServiceInterface<T> = {
    functions: SingletonEntityComponentServiceInterface_Functions<T>;
    events: {
        SETTED: {
            value: T;
        };
    };
};

export abstract class SingletonEntityComponentService<
    TServiceInf extends ServiceInterface &
        SingletonEntityComponentServiceInterface<T> = any,
    T = any
> extends BaseService<TServiceInf> {
    @ModuleRef<Module>('entity')
    private declare _module: Module;

    private declare _collection: Collection<MongoDoc<T>>;
    get collection(): Collection<MongoDoc<T>> {
        if (!this._collection) {
            this._collection = this._module.mongo.collection(this.id);
        }
        return this._collection;
    }

    constructor() {
        super();
    }

    protected async _get(): Promise<T | undefined> {
        const { collection } = this;
        const doc = await collection.findOne({ _id: this.id });
        if (!doc) {
            return undefined;
        }

        return doc.value ?? undefined;
    }

    protected async _set(value: T | undefined): Promise<void> {
        const { collection } = this;
        const now = Date.now();
        const result = await collection.updateOne(
            { _id: this.id },
            { $set: { value } },
            { upsert: true }
        );

        if (result.modifiedCount + result.upsertedCount > 0) {
            await this.emit('SETTED', { time: now, value } as any);
        }
    }
}
