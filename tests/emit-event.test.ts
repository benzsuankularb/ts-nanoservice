import { BaseService, LocalServiceEventEmitter, Service, ServiceInstance, ServiceInstanceBuilder, serviceFactory } from "../src/index";

type ServiceInterface_A = {
    id: "a";
    functions: {
        emitA1(): Promise<void>;
    };
    events: {
        EVENT_A1: object;
    };
    errors: object;
}

export class Service_A extends BaseService<ServiceInterface_A> implements Service<ServiceInterface_A> {
    
    async emitA1(): Promise<void> {
        await this.emit('EVENT_A1', {});
    }
    
}

describe('ServiceRef decorator', () => {

    let instance: ServiceInstance;

    beforeEach(async () => {
        const emitter = new LocalServiceEventEmitter();
        const builder = new ServiceInstanceBuilder()
            .default({
                eventEmitters: () => emitter,
                eventSubscribers: () => emitter.subscriber,
            })
            .appendServices({
                services: [
                    serviceFactory<ServiceInterface_A>('a', () => new Service_A()),
                ],
            });
        
        instance = await builder.createInstance();
        await instance.start();
    })

    it("subscribe event emit", async () => {
        let triggerCount = 0;
        const serviceA = await instance.resolve<ServiceInterface_A>('a');
        const subscriberA = await instance.resolveSubscriber<ServiceInterface_A>('a');
        subscriberA?.on('EVENT_A1', async () => { triggerCount++ });
        await serviceA?.emitA1();
        expect(triggerCount).toBe(1);
    });

});
