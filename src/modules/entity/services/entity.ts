/* eslint-disable @typescript-eslint/no-explicit-any */
import { Collection, ObjectId, WithId } from 'mongodb';
import { BaseService, ModuleRef, ServiceInterface } from '../../../core';
import { Module } from '../module';

type MongoDoc = {
  _id: ObjectId;
  createdTime: number;
  deletedTime?: number;
};

export interface Entity {
  id: string;
  createdTime: number;
  deletedTime?: number;
}

export type EntityServiceInterface = {
  functions: {
    get(id: string): Promise<Entity | undefined>;
    getByIds(ids: string[]): Promise<(Entity | undefined)[]>;
  };
  errors: {
    INVALID_ENTITY: { id: string };
  };
  events: {
    CREATED: {
      id: string;
      time: number;
    };
    DELETED: {
      id: string;
      time: number;
    };
  };
};

export abstract class EntityService<
  TServiceInf extends ServiceInterface & EntityServiceInterface = any
> extends BaseService<TServiceInf> {
  @ModuleRef<Module>('entity')
  private declare _module: Module;

  private declare _collection: Collection<MongoDoc>;
  get collection(): Collection<MongoDoc> {
    if (!this._collection) {
      this._collection = this._module.mongo.collection(this.id);
    }
    return this._collection;
  }

  protected _parseEntity(doc: WithId<MongoDoc>): Entity {
    return {
      id: doc._id.toHexString(),
      createdTime: doc.createdTime,
      deletedTime: doc.deletedTime,
    };
  }

  protected async _get(id: string): Promise<Entity | undefined> {
    if (!ObjectId.isValid(id)) {
      return undefined;
    }

    const { collection } = this;
    const doc = await collection.findOne({ _id: new ObjectId(id) as any });
    if (!doc) {
      return undefined;
    }

    return this._parseEntity(doc);
  }

  protected async _getByIds(ids: string[]): Promise<(Entity | undefined)[]> {
    const { collection } = this;
    const _ids = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    const cursor = collection.find({ _id: { $in: _ids } });
    const docs = await cursor.toArray();
    const docsById: { [id: string]: WithId<MongoDoc> } = {};
    docs.forEach((doc) => (docsById[doc._id.toHexString()] = doc));

    const entities = ids.map((id) => {
      const doc = docsById[id];
      if (!doc) {
        return undefined;
      }
      return this._parseEntity(doc);
    });
    return entities;
  }

  protected async _getAll(): Promise<Entity[]> {
    const { collection } = this;
    const cursor = collection.find({});
    const docs = await cursor.toArray();
    return docs.map((doc) => this._parseEntity(doc));
  }

  protected async _create(): Promise<[newId: string]> {
    const { collection } = this;
    const now = Date.now();
    const _id = new ObjectId();
    await collection.insertOne({
      _id,
      createdTime: now,
    });
    const id = _id.toHexString();
    await this.emit('CREATED', { id, time: now } as any);
    return [id];
  }

  protected async _delete(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) {
      throw this.error('INVALID_ENTITY', { id } as any);
    }

    const { collection } = this;
    const now = Date.now();
    const _id = new ObjectId(id);
    const result = await collection.updateOne(
      { _id, deletedTime: undefined },
      { $set: { deletedTime: now } }
    );

    if (result.modifiedCount === 0) {
      return;
    }

    await this.emit('DELETED', { id, time: now } as any);
  }
}
