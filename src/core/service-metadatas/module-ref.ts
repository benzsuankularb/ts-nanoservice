import 'reflect-metadata';

const metadataKey = Symbol('@module-ref');

interface ModuleRefProp {
    key: string;
    moduleId: string;
}

export function markModuleRefProp(
    target: object,
    propertyKey: string,
    moduleId: string
) {
    const props = Reflect.getMetadata(metadataKey, target) ?? [];
    const prop = { key: propertyKey, moduleId };
    Reflect.defineMetadata(metadataKey, [...props, prop], target);
}

export function getModuleRefProps(origin: object): ModuleRefProp[] {
    return Reflect.getMetadata(metadataKey, origin) ?? [];
}
