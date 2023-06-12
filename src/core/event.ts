import { InferServiceEvents, ServiceInterface } from './service-interface';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ServiceEventListener<T = unknown> = (payload: T) => Promise<void>;

export interface ServiceEventEmitter<T extends ServiceInterface = any> {
  emit<K extends keyof InferServiceEvents<T>>(
    name: K,
    payload: InferServiceEvents<T>[K]
  ): Promise<void>;
}

export interface ServiceEventSubscriber<T extends ServiceInterface = any> {
  on<K extends keyof InferServiceEvents<T>>(
    name: K,
    handler: ServiceEventListener<InferServiceEvents<T>[K]>
  ): void;
}
