/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { markCronProp } from './metadata';

export function Cron(): (
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => void {
  return (target: object, propertyKey: string): void => {
    markCronProp(target, propertyKey);
  };
}
