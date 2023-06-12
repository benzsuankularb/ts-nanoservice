import 'reflect-metadata';

const metadataKey = Symbol('@cron');

interface CronProp {
  propKey: string;
}

export function markCronProp(target: object, propertyKey: string) {
  const props = Reflect.getMetadata(metadataKey, target) ?? [];
  const prop = { key: propertyKey };
  Reflect.defineMetadata(metadataKey, [...props, prop], target);
}

export function getCronProps(origin: object): CronProp[] {
  return Reflect.getMetadata(metadataKey, origin) ?? [];
}
