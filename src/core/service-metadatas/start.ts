/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

const metadataKey = Symbol('@start');

export function markStartProp(target: object, propertyKey: string) {
    const properties = Reflect.getMetadata(metadataKey, target) ?? [];
    Reflect.defineMetadata(metadataKey, [...properties, propertyKey], target);
}

export function getStartProps(target: object): string[] {
    return Reflect.getMetadata(metadataKey, target) ?? [];
}
