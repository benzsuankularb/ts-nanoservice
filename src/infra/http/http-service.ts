/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ServiceError, ServiceErrorPrototype } from '../../core';

export interface HttpServiceOptions {
  endPoint: string;
  id: string;
  prototypeObj: object;
}

export class HttpService {
  private baseUrl: string;

  constructor(options: HttpServiceOptions) {
    this.baseUrl = `${options.endPoint}/${options.id}`;
    const servicePrototype = Object.getPrototypeOf(options.prototypeObj);
    const functionNames = Object.getOwnPropertyNames(servicePrototype)
      .filter((prop) => prop !== 'constructor')
      .filter((prop) => typeof servicePrototype[prop] === 'function');

    functionNames.forEach((functionName) => {
      (this as any)[functionName] = this.createFunction(functionName);
    });
  }

  private createFunction(method: string): () => Promise<any> {
    return async (...args: any[]) => {
      const url = new URL(`${this.baseUrl}/${method}`);
      const response = await fetch(url, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args })
      });

      if (response.status === 400) {
        const { service, type, payload } = response.json() as any;
        throw new ServiceError(
          new ServiceErrorPrototype(service, type),
          payload
        );
      }

      if (response.status !== 200) {
        const { error } = response.json() as any;
        throw error;
      }

      const { result } = response.json() as any;
      return result;
    };
  }
}
