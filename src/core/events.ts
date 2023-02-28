export type ServiceEventListener<T> = (payload: T) => Promise<void>;

export interface ServiceEventEmitter<T> {
  emit<K extends keyof T>(name: K, payload: T[K]): Promise<void>;
}

export interface ServiceEventSubscriber<T> {
  on<K extends keyof T>(name: K, handler: ServiceEventListener<T[K]>): void;
}

export type AnyServiceEventEmitter = ServiceEventEmitter<unknown>;
export type AnyServiceEventSubscriber = ServiceEventSubscriber<unknown>;
export type AnyServiceEventListener = ServiceEventListener<unknown>;
