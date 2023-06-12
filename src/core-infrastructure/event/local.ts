/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InferServiceEvents,
  ServiceEventEmitter,
  ServiceEventListener,
  ServiceEventSubscriber,
  ServiceInterface,
} from '../../core';

export class LocalServiceEventEmitter<T extends ServiceInterface>
  implements ServiceEventEmitter<T>
{
  readonly subscriber: LocalServiceEventSubscriber<T>;

  constructor() {
    this.subscriber = new LocalServiceEventSubscriber();
  }

  async emit<K extends keyof InferServiceEvents<T>>(
    name: K,
    data: InferServiceEvents<T>[K]
  ): Promise<void> {
    this.subscriber._dispatch(name, data);
  }
}

export class LocalServiceEventSubscriber<T extends ServiceInterface>
  implements ServiceEventSubscriber<T>
{
  private listeners: { [name: string]: ServiceEventListener<any>[] } = {};

  _dispatch<K extends keyof InferServiceEvents<T>>(
    name: K,
    data: InferServiceEvents<T>[K]
  ): void {
    this.listeners[name as string]?.forEach((listener) => {
      listener(data).catch(() => {
        this._dispatch(name, data);
      });
    });
  }

  on<K extends keyof InferServiceEvents<T>>(
    name: K,
    handler: ServiceEventListener<InferServiceEvents<T>[K]>
  ): void {
    this.listeners[name as string] ??= [];
    this.listeners[name as string].push(handler);
  }
}
