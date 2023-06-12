import {
  BaseService,
  LocalServiceEventEmitter,
  Service,
  ServiceInstance,
  ServiceInstanceBuilder,
  Subscribe,
} from '../src/index';

type ServiceInterface_A = {
  id: 'a';
  functions: {
    emitA1(): Promise<void>;
  };
  events: {
    EVENT_A1: object;
  };
  errors: object;
};

type ServiceInterface_B = {
  id: 'b';
  functions: object;
  events: object;
  errors: object;
};

type ServiceInterface_C = {
  id: 'c';
  functions: object;
  events: object;
  errors: object;
};

export class Service_A
  extends BaseService<ServiceInterface_A>
  implements Service<ServiceInterface_A>
{
  async emitA1(): Promise<void> {
    await this.emit('EVENT_A1', {});
  }
}

export class Service_B
  extends BaseService<ServiceInterface_B>
  implements Service<ServiceInterface_B>
{
  handler1_Called = false;
  handler2_Called = false;

  @Subscribe<ServiceInterface_A>('a', 'EVENT_A1')
  async handler1(): Promise<void> {
    this.handler1_Called = true;
  }

  @Subscribe<ServiceInterface_A>('a', 'EVENT_A1')
  async handler2(): Promise<void> {
    this.handler2_Called = true;
  }
}

export class Service_C
  extends Service_B
  implements Service<ServiceInterface_C>
{
  handlerC_Called = false;

  @Subscribe<ServiceInterface_A>('a', 'EVENT_A1')
  async handlerC(): Promise<void> {
    this.handlerC_Called = true;
  }
}

describe('ServiceRef decorator', () => {
  let instance: ServiceInstance;

  beforeEach(async () => {
    const emitter = new LocalServiceEventEmitter();
    const builder = new ServiceInstanceBuilder()
      .setDefaultEventEmitter(() => emitter)
      .setDefaultEventSubscriber(() => emitter.subscriber)
      .add<ServiceInterface_A>('a', () => new Service_A())
      .add<ServiceInterface_B>('b', () => new Service_B())
      .add<ServiceInterface_C>('c', () => new Service_C());

    instance = await builder.createInstance();
    await instance.start();
  });

  it('subscribe', async () => {
    const serviceA = await instance.resolve<ServiceInterface_A>('a');
    const serviceB = (await instance.resolve<ServiceInterface_B>(
      'b'
    )) as Service_B;
    await serviceA?.emitA1();
    expect(serviceB.handler1_Called).toBeTruthy;
    expect(serviceB.handler2_Called).toBeTruthy;
  });

  it('inheritance', async () => {
    const serviceA = await instance.resolve<ServiceInterface_A>('a');
    const serviceC = (await instance.resolve<ServiceInterface_C>(
      'c'
    )) as Service_C;
    await serviceA?.emitA1();
    expect(serviceC.handler1_Called).toBeTruthy;
    expect(serviceC.handler2_Called).toBeTruthy;
    expect(serviceC.handlerC_Called).toBeTruthy;
  });
});
