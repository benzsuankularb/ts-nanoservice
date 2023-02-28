import express, { Router } from 'express';
import { ServiceError } from '../../core';

export class HttpServiceListener {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  async addService(id: string, service: never): Promise<void> {
    const { router } = this;
    const servicePrototype = Object.getPrototypeOf(service);
    const serviceFunctionNames = Object.getOwnPropertyNames(servicePrototype)
      .filter((prop) => prop !== 'constructor')
      .filter((prop) => typeof servicePrototype[prop] === 'function');

    router.post(`${id}/:method`, async (req, res) => {
      const serviceFuntionNameSet = new Set(serviceFunctionNames);
      const { method } = req.params;
      if (!serviceFuntionNameSet.has(method)) {
        return res.status(404).send();
      }

      const args = req.body.args as [];
      try {
        const result = await (
          service[method] as (...args: unknown[]) => Promise<unknown>
        )(...args);
        return res.status(200).send({ result });
      } catch (e) {
        if (e instanceof ServiceError) {
          return res.status(400).send(e);
        } else {
          return res.status(500).send(e);
        }
      }
    });
  }

  listen(port: number) {
    const app = express();
    app.use(express.json());
    app.listen(port);
  }
}
