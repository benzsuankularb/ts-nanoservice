import 'reflect-metadata';

const metadataKey = Symbol('@subscribe');

interface SubscribeProp {
    key: string;
    serviceId: string;
    eventId: string;
}

export function markSubscribeProp(
    target: object,
    propertyKey: string,
    serviceId: string,
    eventId: string
) {
    const props = Reflect.getMetadata(metadataKey, target) ?? [];
    const prop = { key: propertyKey, serviceId, eventId };
    Reflect.defineMetadata(metadataKey, [...props, prop], target);
}

export function getSubscribeProps(origin: object): SubscribeProp[] {
    return Reflect.getMetadata(metadataKey, origin) ?? [];
}
