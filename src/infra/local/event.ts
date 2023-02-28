import {
  AnyServiceEventEmitter,
  AnyServiceEventListener,
  AnyServiceEventSubscriber,
  ServiceEventEmitter,
  ServiceEventSubscriber
} from '../../core';

export class LocalServiceEventEmitter implements AnyServiceEventEmitter {
  private _subscriber: LocalServiceEventSubscriber;

  static create<T>(): ServiceEventEmitter<T> {
    return new this() as ServiceEventEmitter<T>;
  }

  subscriber<T>(): ServiceEventSubscriber<T> {
    return this._subscriber as ServiceEventSubscriber<T>;
  }

  constructor() {
    this._subscriber = new LocalServiceEventSubscriber();
  }

  async emit(name: string, data: unknown): Promise<void> {
    this._subscriber.dispatch(name, data);
  }
}

export class LocalServiceEventSubscriber implements AnyServiceEventSubscriber {
  private listeners: { [name: string]: AnyServiceEventListener[] } = {};

  dispatch(name: string, data: unknown): void {
    this.listeners[name]?.forEach((listener) => {
      listener(data).catch(() => {
        this.dispatch(name, data);
      });
    });
  }

  on(name: string, listener: AnyServiceEventListener): void {
    this.listeners[name] ??= [];
    this.listeners[name].push(listener);
  }
}
