/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceModule } from '../../core/service-module-registry';
import { CronStorage, MemoryStorage } from './storage';

export const ModuleId = 'cron';

export interface ModuleOptions {
    storage?: CronStorage;
}

export class Module extends ServiceModule<'cron'> {
    id = 'cron' as const;
    storage: CronStorage;

    constructor(options?: ModuleOptions) {
        super();
        this.storage = options?.storage ?? new MemoryStorage();
    }
}
