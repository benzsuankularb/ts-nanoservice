import { Factory, MaybeFactory } from '../utils/types';
import { BaseService } from './base-service';

export type InferModuleID<T extends ServiceModule> = T extends ServiceModule<
  infer U
>
  ? U
  : never;

export abstract class ServiceModule<TID extends string = string> {
  abstract id: TID;
  abstract registerService(service: BaseService): void;
}

export class ServiceModuleRegistry {
  _factories: { [moduleId: string]: Factory<ServiceModule> } = {};
  _modules: { [moduleId: string]: ServiceModule } = {};

  add(id: string, factory: MaybeFactory<ServiceModule>) {
    if (typeof factory === 'function') {
      this._factories[id] = factory;
      return;
    }

    this._modules[factory.id] = factory;
  }

  async resolve<T extends ServiceModule>(
    id: InferModuleID<T>
  ): Promise<T | undefined> {
    const { _factories, _modules } = this;

    if (_modules[id]) {
      return _modules[id] as T;
    }

    if (!_factories[id]) {
      return undefined;
    }

    const factory = _factories[id];
    if (typeof factory === 'function') {
      _modules[id] = await factory();
    } else {
      _modules[id] = factory;
    }
    _modules[id].id = id;

    return _modules[id] as T | undefined;
  }
}
