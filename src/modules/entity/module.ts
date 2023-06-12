import { Db } from 'mongodb';
import { ServiceModule } from '../../core/service-module-registry';

export interface ModuleOptions {
  mongo: Db;
}

export class Module extends ServiceModule<'entity'> {
  id = 'entity' as const;
  mongo: Db;

  constructor(options: ModuleOptions) {
    super();
    this.mongo = options.mongo;
  }

  registerService(): void {}
}
