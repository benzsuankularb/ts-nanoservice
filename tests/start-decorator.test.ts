import { BaseService, Service, ServiceInstance, ServiceInstanceBuilder, Start, serviceFactory } from "../src/index";

type ServiceInterface_A = {
    id: "a";
    functions: object;
    events: object;
    errors: object;
}

type ServiceInterface_B = {
    id: "b";
    functions: object;
    events: object;
    errors: object;
}

class Service_A extends BaseService<ServiceInterface_A> implements Service<ServiceInterface_A> {

    serviceA_started1 = false;
    serviceA_started2 = false;

    @Start()
    startA_1(): void {
        this.serviceA_started1 = true;
    }

    @Start()
    startA_2(): void {
        this.serviceA_started2 = true;
    }
}

class Service_B extends Service_A implements Service<ServiceInterface_B> {

    serviceB_started = false;

    @Start()
    startB(): void {
        this.serviceB_started = true;
    }

}

describe('Start decorator', () => {

    let instance: ServiceInstance;

    beforeEach(async () => {
        const builder = new ServiceInstanceBuilder()
            .appendServices({
                services: [
                    serviceFactory<ServiceInterface_A>('a', () => new Service_A()),
                    serviceFactory<ServiceInterface_B>('b', () => new Service_B())
                ],
            });
        
        instance = await builder.createInstance();
    })

    it("start decorator", async () => {
        const serviceA = await instance.resolve<ServiceInterface_A>('a') as Service_A;
        expect(serviceA.startA_1).toBeFalsy;
        expect(serviceA.startA_2).toBeFalsy;
        await instance.start();
        expect(serviceA.startA_1).toBeTruthy;
        expect(serviceA.startA_2).toBeTruthy;
    });

    it("inheritance", async () => {
        const serviceA = await instance.resolve<ServiceInterface_A>('a') as Service_A;
        const serviceB = await instance.resolve<ServiceInterface_B>('b') as Service_B;
        expect(serviceA.startA_1).toBeFalsy;
        expect(serviceA.startA_2).toBeFalsy;
        expect(serviceB.startB).toBeFalsy;
        await instance.start();
        expect(serviceA.startA_1).toBeTruthy;
        expect(serviceA.startA_2).toBeTruthy;
        expect(serviceB.startB).toBeTruthy;
    });

});
