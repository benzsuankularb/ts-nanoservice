/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { BaseService } from '../../core';
import { markModuleDependency } from '../../core/service-metadatas';
import { Module, ModuleId } from './module';

const metadataKey = Symbol('@cron');

export type CronHandler = (prevTime: number, time: number) => Promise<void>;

export function Cron(
    id: string,
    interval: number
): (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
) => void {
    return (
        target: object,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        markModuleDependency(target, ModuleId);
        markStartProp(target, propertyKey);
        return {
            get() {
                const service = this as BaseService;
                const cronKey = `${service.id}--${id}`;
                const module = service._modules[ModuleId] as Module;
                const { storage } = module;

                const execute = async () => {
                    const prevTime = await storage.get(cronKey);
                    const time = Date.now();
                    try {
                        const handler = descriptor.value.bind(
                            target
                        ) as CronHandler;
                        await handler(prevTime, time);
                    } catch (e) {
                        console.log(e);
                        return;
                    }
                    await storage.set(cronKey, time);
                };

                const startCron = async () => {
                    setTimeout(async () => {
                        await execute();
                        startCron();
                    }, interval);
                };

                Object.defineProperty(this, propertyKey, {
                    value: startCron,
                    configurable: true,
                    writable: true
                });

                return startCron;
            }
        };
    };
}

export function markStartProp(target: object, propertyKey: string) {
    const props = Reflect.getMetadata(metadataKey, target) ?? [];
    Reflect.defineMetadata(metadataKey, [...props, propertyKey], target);
}

export function getStartProps(target: object): string[] {
    return Reflect.getMetadata(metadataKey, target) ?? [];
}
