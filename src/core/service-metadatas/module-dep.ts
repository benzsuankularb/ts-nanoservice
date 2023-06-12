import 'reflect-metadata';

const metadataKey = Symbol('@module-dep');

export function markModuleDependency(target: object, moduleId: string) {
  const moduleIds = Reflect.getMetadata(metadataKey, target) ?? [];
  Reflect.defineMetadata(metadataKey, [...moduleIds, moduleId], target);
}

export function getModuleDependencies(origin: object): string[] {
  return Reflect.getMetadata(metadataKey, origin) ?? [];
}
