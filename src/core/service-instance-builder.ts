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
    getSubscribeProps
} from './service-metadatas';
import {
    InferModuleID,
    ServiceModule,
    ServiceModuleRegistry
} from './service-module-registry';
import { ServiceRegistry } from './service-registry';

export interface ServiceInstanceBuilder_ServiceFactory<
    T extends ServiceInterface = any
> {
    id: InferServiceID<T>;
    factory: MaybeFactory<Service<T>>;
}

export function serviceFactory<
    T extends ServiceInterface = ServiceInterface<never, never, never, never>
>(
    id: InferServiceID<T>,
    factory: MaybeFactory<Service<T>>
): ServiceInstanceBuilder_ServiceFactory {
    return {
        id,
        factory
    };
}

export interface ServiceInstanceBuilder_ModuleFactory<
    T extends ServiceModule = any
> {
    id: InferModuleID<T>;
    factory: MaybeFactory<T>;
}

export function moduleFactory<T extends ServiceModule>(
    id: InferModuleID<T>,
    factory: MaybeFactory<T>
): ServiceInstanceBuilder_ModuleFactory {
    return {
        id,
        factory
    };
}

export interface ServiceInstanceBuilder_ServiceGroup {
    services: ServiceInstanceBuilder_ServiceFactory[];
    modules?: ServiceInstanceBuilder_ModuleFactory[];
    eventSubscribers?: (
        serviceId: string
    ) => MaybePromise<ServiceEventSubscriber>;
    eventEmitters?: (serviceId: string) => MaybePromise<ServiceEventEmitter>;
}

export interface ServiceInstanceBuilder_Default {
    modules?: ServiceInstanceBuilder_ModuleFactory[];
    eventSubscribers?: (
        serviceId: string
    ) => MaybePromise<ServiceEventSubscriber>;
    eventEmitters?: (serviceId: string) => MaybePromise<ServiceEventEmitter>;
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

    default(defaultFactories: ServiceInstanceBuilder_Default): this {
        this._defaultEventEmitters = defaultFactories.eventEmitters;
        this._defaultEventSubscribers = defaultFactories.eventSubscribers;

        if (defaultFactories.modules) {
            for (const module of defaultFactories.modules) {
                this._defaultModuleRegistry.add(module.id, module.factory);
            }
        }

        return this;
    }

    appendServices(group: ServiceInstanceBuilder_ServiceGroup): this {
        const { services, modules, eventEmitters, eventSubscribers } = group;
        const { _defaultEventEmitters, _defaultEventSubscribers } = this;
        const moduleRegistry = new ServiceModuleRegistry();
        for (const module of modules ?? []) {
            moduleRegistry.add(module.id, module.factory);
        }
        for (const service of services) {
            this._serviceRegistry.add(service.id, {
                service: service.factory,
                emitter: () =>
                    (eventEmitters ?? _defaultEventEmitters)?.(service.id),
                subscriber: () =>
                    (eventSubscribers ?? _defaultEventSubscribers)?.(service.id)
            });
            this._serviceModuleRegistries[service.id] = moduleRegistry;
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
            const emitter = await this._serviceRegistry.resolveEmitter(
                serviceId
            );
            if (emitter) {
                service._emitter = emitter;
            } else {
                unresolvableEmitters.add(serviceId);
            }

            // subscribe events
            const subscribeProps = getSubscribeProps(service);
            for (const prop of subscribeProps) {
                const subscriber =
                    await this._serviceRegistry.resolveSubscriber(
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
                const dependentService =
                    await this._serviceRegistry.resolveService(prop.serviceId);
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
                let module = await this._serviceModuleRegistries[
                    serviceId
                ]?.resolve(prop.moduleId);

                if (!module) {
                    module = await this._defaultModuleRegistry.resolve(
                        prop.moduleId
                    );
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
                let module = await this._serviceModuleRegistries[
                    serviceId
                ]?.resolve(moduleId);

                if (!module) {
                    module = await this._defaultModuleRegistry.resolve(
                        moduleId
                    );
                }

                if (!module) {
                    unresolvableModules.add(moduleId);
                    continue;
                }

                (service as BaseService)._modules[moduleId] = module;
            }
        };

        for (const serviceId of this._serviceRegistry.serviceIds) {
            await resolveService(serviceId);
        }

        unresolvableServices.forEach((serviceId) =>
            console.warn(`Unable to resolve "${serviceId}" service`)
        );
        unresolvableSubscribers.forEach((serviceId) =>
            console.warn(
                `Unable to resolve subscriber of "${serviceId}" service`
            )
        );
        unresolvableModules.forEach((moduleId) =>
            console.warn(`Unable to resolve "${moduleId}" module`)
        );
    }

    async createInstance(): Promise<ServiceInstance> {
        await this._resolveServices();
        return new ServiceInstance(this._serviceRegistry);
    }
}
