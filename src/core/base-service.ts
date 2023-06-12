/* eslint-disable @typescript-eslint/no-explicit-any */

import { ServiceError } from './error';
import { ServiceEventEmitter } from './event';
import {
  InferServiceErrors,
  InferServiceEvents,
  ServiceInterface,
} from './service-interface';
import { ServiceModule } from './service-module-registry';

export class BaseService<T extends ServiceInterface = any> {
  declare id: string;

  declare _emitter: ServiceEventEmitter<any>;
  declare _modules: { [moduleId: string]: ServiceModule };

  constructor() {
    this._modules = {};
  }

  error<TErr extends keyof InferServiceErrors<T>>(
    errorId: TErr,
    payloads: InferServiceErrors<T>[TErr],
    inner?: Error
  ): ServiceError<InferServiceErrors<T>[TErr]> {
    if (!inner) {
      inner = Error();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const stackItems = inner.stack!.split('\n');
      stackItems.splice(1, 1);
      inner.stack = stackItems.join('\n');
    }
    return new ServiceError({
      serviceId: this.id,
      payloads,
      errorId: errorId as string,
      inner,
    });
  }

  async emit<TEvt extends keyof InferServiceEvents<T>>(
    eventId: TEvt,
    payloads: InferServiceEvents<T>[TEvt]
  ): Promise<void> {
    await this._emitter.emit(eventId, payloads);
  }
}
