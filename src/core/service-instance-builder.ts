/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybeFactory, MaybePromise } from '../utils/types';
import { BaseService } from './base-service';
import { ServiceEventEmitter, ServiceEventSubscriber } from './event';
import { ServiceInstance } from './service-instance';
import { InferServiceID, Service, ServiceInterface } from './service-interface';
import {
  getModuleDependencies,
  getModuleRefProps,
  getServiceRefProps,
  getSubscribeProps,
} from './service-metadatas';
import {
  InferModuleID,
  ServiceModule,
  ServiceModuleRegistry,
} from './service-module-registry';
import { ServiceRegistry } from './service-registry';

export function createServiceGroup() {
  return new ServiceGroup();
}

export class ServiceGroup {
  _services: { [serviceId: string]: MaybeFactory<Service> } = {};
  _modules: { [serviceId: string]: MaybeFactory<ServiceModule> } = {};
  _eventSubscribers?: (
    serviceId: string
  ) => MaybePromise<ServiceEventSubscriber>;

  _eventEmitters?: (
    serviceId: string //
  ) => MaybePromise<ServiceEventEmitter>;

  addModule<T extends ServiceModule = any>(
    id: InferModuleID<T>,
    factory: MaybeFactory<T>
  ): this {
    this._modules[id] = factory;
    return this;
  }

  add<T extends ServiceInterface = any>(
    id: InferServiceID<T>,
    factory: MaybeFactory<Service<T>>
  ): this {
    this._services[id] = factory;
    return this;
  }

  setEventEmitter(
    factory: (serviceId: string) => MaybePromise<ServiceEventEmitter>
  ): this {
    this._eventEmitters = factory;
    return this;
  }

  setEventSubscriber(
    factory: (serviceId: string) => MaybePromise<ServiceEventSubscriber>
  ): this {
    this._eventSubscribers = factory;
    return this;
  }
}

export class ServiceInstanceBuilder {
  _serviceRegistry: ServiceRegistry;
  _serviceModuleRegistries: { [serviceId: string]: ServiceModuleRegistry };
  _defaultModuleRegistry: ServiceModuleRegistry;
  _defaultEventSubscribers?: (
    serviceId: string
  ) => MaybePromise<ServiceEventSubscriber>;
  _defaultEventEmitters?: (
    serviceId: string
  ) => MaybePromise<ServiceEventEmitter>;

  constructor() {
    this._serviceRegistry = new ServiceRegistry();
    this._defaultModuleRegistry = new ServiceModuleRegistry();
    this._serviceModuleRegistries = {};
  }

  addDefaultModule<T extends ServiceModule = any>(
    id: InferModuleID<T>,
    factory: MaybeFactory<T>
  ): this {
    this._defaultModuleRegistry.add(id, factory);
    return this;
  }

  setDefaultEventEmitter(
    factory: (serviceId: string) => MaybePromise<ServiceEventEmitter>
  ): this {
    this._defaultEventEmitters = factory;
    return this;
  }

  setDefaultEventSubscriber(
    factory: (serviceId: string) => MaybePromise<ServiceEventSubscriber>
  ): this {
    this._defaultEventSubscribers = factory;
    return this;
  }

  add<T extends ServiceInterface = any>(
    id: InferServiceID<T>,
    factory: MaybeFactory<Service<T>>
  ): this {
    this._serviceRegistry.add(id, {
      service: factory,
      emitter: () => this._defaultEventEmitters?.(id),
      subscriber: () => this._defaultEventSubscribers?.(id),
    });
    return this;
  }

  addGroup(group: ServiceGroup): this {
    const {
      _services: services,
      _modules: modules,
      _eventEmitters: eventEmitters,
      _eventSubscribers: eventSubscribers,
    } = group;
    const { _defaultEventEmitters, _defaultEventSubscribers } = this;
    const moduleRegistry = new ServiceModuleRegistry();
    for (const moduleId of Object.keys(modules) ?? []) {
      moduleRegistry.add(moduleId, modules[moduleId]);
    }
    for (const serviceId of Object.keys(services)) {
      this._serviceRegistry.add(serviceId, {
        service: services[serviceId],
        emitter: () => (eventEmitters ?? _defaultEventEmitters)?.(serviceId),
        subscriber: () =>
          (eventSubscribers ?? _defaultEventSubscribers)?.(serviceId),
      });
      this._serviceModuleRegistries[serviceId] = moduleRegistry;
    }
    return this;
  }

  private async _resolveServices() {
    const unresolvableServices = new Set<string>();
    const unresolvableEmitters = new Set<string>();
    const unresolvableSubscribers = new Set<string>();
    const unresolvableModules = new Set<string>();

    const resolveService = async (serviceId: string) => {
      const service = (await this._serviceRegistry.resolveService(
        serviceId
      )) as BaseService;

      if (!service) {
        unresolvableServices.add(serviceId);
        return;
      }

      // inject emitter
      const emitter = await this._serviceRegistry.resolveEmitter(serviceId);
      if (emitter) {
        service._emitter = emitter;
      } else {
        unresolvableEmitters.add(serviceId);
      }

      // subscribe events
      const subscribeProps = getSubscribeProps(service);
      for (const prop of subscribeProps) {
        const subscriber = await this._serviceRegistry.resolveSubscriber(
          prop.serviceId
        );
        if (!subscriber) {
          unresolvableSubscribers.add(prop.serviceId);
          continue;
        }
        const handler = (service as any)[prop.key].bind(service) as (
          ...args: any[]
        ) => Promise<any>;
        subscriber.on(prop.eventId, handler);
      }

      // inject service ref
      const serviceRefProps = getServiceRefProps(service);
      for (const prop of serviceRefProps) {
        const dependentService = await this._serviceRegistry.resolveService(
          prop.serviceId
        );
        if (!dependentService) {
          unresolvableServices.add(prop.serviceId);
          continue;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any)[prop.key] = dependentService;
      }

      // inject module ref
      const moduleRefProps = getModuleRefProps(service);
      for (const prop of moduleRefProps) {
        let module = await this._serviceModuleRegistries[serviceId]?.resolve(
          prop.moduleId
        );

        if (!module) {
          module = await this._defaultModuleRegistry.resolve(prop.moduleId);
        }

        if (!module) {
          unresolvableModules.add(prop.moduleId);
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any)[prop.key] = module;
      }

      // inject modules
      const moduleDependencies = getModuleDependencies(service);
      for (const moduleId of moduleDependencies) {
        let module = await this._serviceModuleRegistries[serviceId]?.resolve(
          moduleId
        );

        if (!module) {
          module = await this._defaultModuleRegistry.resolve(moduleId);
        }

        if (!module) {
          unresolvableModules.add(moduleId);
          continue;
        }

        (service as BaseService)._modules[moduleId] = module;
        module.registerService(service);
      }
    };

    for (const serviceId of this._serviceRegistry.serviceIds) {
      await resolveService(serviceId);
    }

    unresolvableServices.forEach((serviceId) =>
      console.warn(`Unable to resolve "${serviceId}" service`)
    );
    unresolvableSubscribers.forEach((serviceId) =>
      console.warn(`Unable to resolve subscriber of "${serviceId}" service`)
    );
    unresolvableModules.forEach((moduleId) =>
      console.warn(`Unable to resolve "${moduleId}" module`)
    );

    if (unresolvableServices.size > 0) {
      throw 'All services must be resolved';
    }
  }

  async createInstance(): Promise<ServiceInstance> {
    await this._resolveServices();
    return new ServiceInstance(this._serviceRegistry);
  }
}
