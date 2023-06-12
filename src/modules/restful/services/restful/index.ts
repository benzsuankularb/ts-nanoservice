import cors from 'cors';
import express, { Router } from 'express';
import morgan from 'morgan';
import { BaseService, ServiceInterface, Start } from '../../../../core';

import {
  injectDependencies,
  responseContentType,
  responseHealthCheck,
  responseNotFound,
  responseServiceError,
  responseSpec,
} from './middleware';

export type RestfulServiceOptions = {
  port: number;
};

export abstract class RestfulService<
  T extends ServiceInterface,
  TDeps
> extends BaseService<T> {
  private options: RestfulServiceOptions;

  constructor(options: RestfulServiceOptions) {
    super();
    this.options = options;
  }

  abstract registerRoutes(router: Router): void;
  abstract getSpecPath(): string;
  abstract getDependencies(): Promise<TDeps>;

  @Start()
  async startGateway(): Promise<void> {
    const app = express();
    const dependencies = await this.getDependencies();

    // setup api routers
    const apiRouter = Router();
    apiRouter.use(injectDependencies(dependencies));
    this.registerRoutes(apiRouter);

    // setup apps
    app.use(morgan('tiny'));
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(responseContentType());
    app.use(responseSpec(this.getSpecPath()));
    app.use(responseHealthCheck());
    app.use(apiRouter);
    app.use(responseNotFound());
    app.use(responseServiceError());

    const port = this.options.port;
    app.listen(port, () => {
      const baseUrl = `http://localhost:${port}`;
      console.log('Restful server is running:');
      console.log(`   api: ${baseUrl}`);
      console.log(`   spec: https://editor.swagger.io/?url=${baseUrl}/spec`);
    });
  }
}
