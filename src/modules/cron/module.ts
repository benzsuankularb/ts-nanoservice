/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseService } from '../../core';
import { ServiceModule } from '../../core/service-module-registry';
import { CronInvoker } from './invoker';
import { getCronProps } from './metadata';
import { CronSessionStorage, MemoryCronSessionStorage } from './storage';

export const ModuleId = 'cron';

export interface ModuleOptions {
    storage?: CronSessionStorage;
    invoker: CronInvoker;
}

export type CronHandler = (prevTime: number, time: number) => Promise<void>;

export class Module extends ServiceModule<'cron'> {
    id = 'cron' as const;
    private readonly storage: CronSessionStorage;
    private services: BaseService[];

    constructor(options: ModuleOptions) {
        super();
        this.storage = options?.storage ?? new MemoryCronSessionStorage();
        this.services = [];
        options.invoker(this.invoke.bind(this));
    }

    registerService(service: BaseService<any>): void {
        const cronProps = getCronProps(service);
        if (cronProps.length > 1) {
            throw `"${service.id}" only able to have one cron prop`;
        }

        if (cronProps.length === 0) {
            return;
        }

        this.services.push(service);
    }

    invoke() {
        const { storage } = this;
        for (const service of this.services) {
            const execute = async () => {
                try {
                    const [prevTime] = await storage.open(service.id);
                    const now = Date.now();
                    const [cronProp] = getCronProps(service);
                    const handler = (service as any)[
                        cronProp.propKey
                    ] as CronHandler;
                    await handler(prevTime, now);
                    await storage.close(service.id, now);
                } catch (e) {
                    await storage.close(service.id);
                    console.log(e);
                }
            };
            execute();
        }
    }
}
