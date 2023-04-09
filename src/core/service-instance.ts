import { ServiceEventSubscriber } from './event';
import { InferServiceID, Service, ServiceInterface } from './service-interface';
import { getStartProps } from './service-metadatas';
import { ServiceRegistry } from './service-registry';

export class ServiceInstance {
    private _serviceRegistry: ServiceRegistry;
    private _started: boolean;

    constructor(serviceRegistry: ServiceRegistry) {
        this._serviceRegistry = serviceRegistry;
        this._started = false;
    }

    async start(): Promise<void> {
        if (this._started) {
            throw 'service instance already started';
        }
        this._started = true;
        for (const serviceId of this._serviceRegistry.serviceIds) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const service = (await this._serviceRegistry.resolveService(
                serviceId
            ))!;

            const startProps = getStartProps(Object.getPrototypeOf(service));
            const startPromises = startProps
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((propKey) => (service as any)[propKey])
                .map((func) => func.bind(service) as () => Promise<void>)
                .map((func) => func());

            try {
                Promise.all(startPromises);
            } catch (e) {
                console.error(`Unable to start the service "${serviceId}"`);
                throw e;
            }
        }
    }

    async resolve<T extends ServiceInterface>(
        id: InferServiceID<T>
    ): Promise<Service<T> | undefined> {
        return this._serviceRegistry.resolveService<T>(id);
    }

    async resolveSubscriber<T extends ServiceInterface>(
        id: InferServiceID<T>
    ): Promise<ServiceEventSubscriber<T> | undefined> {
        return this._serviceRegistry.resolveSubscriber<T>(id);
    }
}
