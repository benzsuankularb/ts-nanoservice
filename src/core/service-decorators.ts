import {
    InferServiceEvents,
    InferServiceID,
    ServiceInterface
} from './service-interface';
import {
    markModuleRefProp,
    markServiceRefProp,
    markStartProp,
    markSubscribeProp
} from './service-metadatas';
import { InferModuleID, ServiceModule } from './service-module-registry';

export function Start(): (target: object, propertyKey: string) => void {
    return (target: object, propertyKey: string): void => {
        markStartProp(target, propertyKey);
    };
}

export function ServiceRef<T extends ServiceInterface>(
    id: InferServiceID<T>
): (target: object, propertyKey: string) => void {
    return (target: object, propertyKey: string): void => {
        markServiceRefProp(target, propertyKey, id);
    };
}

export function ModuleRef<T extends ServiceModule>(
    id: InferModuleID<T>
): (target: object, propertyKey: string) => void {
    return (target: object, propertyKey: string): void => {
        markModuleRefProp(target, propertyKey, id);
    };
}

export function Subscribe<T extends ServiceInterface>(
    serviceId: InferServiceID<T>,
    eventId: keyof InferServiceEvents<T>
): (target: object, propertyKey: string) => void {
    return (target: object, propertyKey: string): void => {
        markSubscribeProp(target, propertyKey, serviceId, eventId as string);
    };
}
