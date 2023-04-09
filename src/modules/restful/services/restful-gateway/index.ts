import { BaseService, ServiceInterface } from '../../../../core';

export type RestfulGatewayServiceInterface = {
    errors: {
        NO_RESOURCE: { id: string };
        UNAUTHORIZED: object;
        INTERNAL: object;
    };
};

export abstract class RestfulGatewayService<
    T extends ServiceInterface & RestfulGatewayServiceInterface
> extends BaseService<T> {
    //
}
