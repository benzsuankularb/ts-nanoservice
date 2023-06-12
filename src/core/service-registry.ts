/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybeFactory } from '../utils/types';
import { BaseService } from './base-service';
import { ServiceEventEmitter, ServiceEventSubscriber } from './event';
import { ServiceInterface } from './service-interface';

interface ServiceFactory {
  service: MaybeFactory<BaseService>;
  subscriber: MaybeFactory<ServiceEventSubscriber | undefined>;
  emitter: MaybeFactory<ServiceEventEmitter | undefined>;
}

export class ServiceRegistry {
  private _factories: { [id: string]: ServiceFactory } = {};

  private _services: { [id: string]: BaseService } = {};
  private _subscribers: { [id: string]: ServiceEventSubscriber | undefined } =
    {};
  private _emitters: { [id: string]: ServiceEventEmitter | undefined } = {};

  get serviceIds(): string[] {
    return Object.keys(this._factories);
  }

  add(id: string, factory: ServiceFactory): [duplicated: boolean] {
    let duplicated = false;
    if (this._factories[id]) {
      duplicated = true;
    }
    this._factories[id] = factory;
    return [duplicated];
  }

  async resolveService<T extends ServiceInterface>(
    id: string
  ): Promise<BaseService<T> | undefined> {
    const { _factories, _services } = this;

    if (_services[id]) {
      return _services[id] as BaseService<T>;
    }

    if (!_factories[id]) {
      return undefined;
    }

    const service = _factories[id].service;
    if (typeof service === 'function') {
      _services[id] = await service();
    } else {
      _services[id] = service;
    }
    _services[id].id = id;

    return _services[id] as BaseService<T>;
  }

  async resolveSubscriber<T extends ServiceInterface>(
    id: string
  ): Promise<ServiceEventSubscriber<T> | undefined> {
    const { _factories, _subscribers } = this;

    if (_subscribers[id]) {
      return _subscribers[id] as ServiceEventSubscriber<T>;
    }

    if (!_factories[id]) {
      return undefined;
    }

    const subscriber = _factories[id].subscriber;
    if (typeof subscriber === 'function') {
      _subscribers[id] = await subscriber();
    } else {
      _subscribers[id] = subscriber;
    }

    return _subscribers[id] as ServiceEventSubscriber<T>;
  }

  async resolveEmitter<T extends ServiceInterface>(
    id: string
  ): Promise<ServiceEventEmitter<T> | undefined> {
    const { _factories, _emitters } = this;

    if (_emitters[id]) {
      return _emitters[id] as ServiceEventEmitter<T>;
    }

    if (!_factories[id]) {
      return undefined;
    }

    const emitter = _factories[id].emitter;
    if (typeof emitter === 'function') {
      _emitters[id] = await emitter();
    } else {
      _emitters[id] = emitter;
    }

    return _emitters[id] as ServiceEventEmitter<T>;
  }
}
