import 'reflect-metadata';

const metadataKey = Symbol('@service-ref');

interface ServiceRefProp {
    key: string;
    serviceId: string;
}

export function markServiceRefProp(
    target: object,
    propertyKey: string,
    serviceId: string
) {
    const props = Reflect.getMetadata(metadataKey, target) ?? [];
    const prop = { key: propertyKey, serviceId: serviceId };
    Reflect.defineMetadata(metadataKey, [...props, prop], target);
}

export function getServiceRefProps(origin: object): ServiceRefProp[] {
    return Reflect.getMetadata(metadataKey, origin) ?? [];
}
