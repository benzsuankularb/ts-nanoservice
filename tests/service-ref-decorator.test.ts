import {
  BaseService,
  Service,
  ServiceInstance,
  ServiceInstanceBuilder,
  ServiceInterface,
  ServiceRef,
} from '../src/index';

type ServiceInterface_A = {
  id: 'a';
  functions: object;
  events: object;
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

type ServiceInterface_D1 = {
  id: 'd1';
  functions: object;
  events: object;
  errors: object;
};

type ServiceInterface_D2 = {
  id: 'd2';
  functions: object;
  events: object;
  errors: object;
};

export class Service_A
  extends BaseService<ServiceInterface_A>
  implements Service<ServiceInterface_A> {}

export class Service_B
  extends BaseService<ServiceInterface_B>
  implements Service<ServiceInterface_B> {}

export class Service_C
  extends BaseService<ServiceInterface_C>
  implements Service<ServiceInterface_C>
{
  @ServiceRef<ServiceInterface_A>('a')
  declare serviceA: Service<ServiceInterface_A>;

  @ServiceRef<ServiceInterface_B>('b')
  declare serviceB: Service<ServiceInterface_B>;
}

export class Service_D1<T extends ServiceInterface>
  extends BaseService<T>
  implements Service<ServiceInterface_D1>
{
  @ServiceRef<ServiceInterface_A>('a')
  declare serviceA: Service<ServiceInterface_A>;
}

export class Service_D2
  extends Service_D1<ServiceInterface_D2>
  implements Service<ServiceInterface_D2>
{
  @ServiceRef<ServiceInterface_B>('b')
  declare serviceB: Service<ServiceInterface_B>;
}

describe('ServiceRef decorator', () => {
  let instance: ServiceInstance;

  beforeEach(async () => {
    const builder = new ServiceInstanceBuilder()
      .add<ServiceInterface_A>('a', () => new Service_A())
      .add<ServiceInterface_B>('b', () => new Service_B())
      .add<ServiceInterface_C>('c', () => new Service_C())
      .add<ServiceInterface_D1>('d1', () => new Service_D1())
      .add<ServiceInterface_D2>('d2', () => new Service_D2());

    instance = await builder.createInstance();
  });

  it('inject refs', async () => {
    const serviceC = (await instance.resolve<ServiceInterface_C>(
      'c'
    )) as Service_C;
    expect(serviceC.serviceA).toBeInstanceOf(Service_A);
    expect(serviceC.serviceB).toBeInstanceOf(Service_B);
  });

  it('inject refs inheritance', async () => {
    const serviceD2 = (await instance.resolve<ServiceInterface_D2>(
      'd2'
    )) as Service_D2;
    expect(serviceD2.serviceA).toBeInstanceOf(Service_A);
    expect(serviceD2.serviceB).toBeInstanceOf(Service_B);
  });
});
