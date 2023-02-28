/* eslint-disable @typescript-eslint/no-explicit-any */

type ServiceErrorPayload = { [key: string]: boolean | string | number };

export class ServerErrorFactory {
  private serviceId: string;

  constructor(serviceId: string) {
    this.serviceId = serviceId;
  }

  createPrototype<TPayload extends ServiceErrorPayload>(options: {
    id: string;
    message: string;
  }): ServiceErrorPrototype<TPayload> {
    return new ServiceErrorPrototype<TPayload>(
      this.serviceId,
      options.id,
      options.message
    );
  }
}

export class ServiceErrorPrototype<TPayload extends ServiceErrorPayload> {
  readonly serviceId: string;
  readonly errorId: string;
  readonly errorMessage?: string;

  constructor(serviceId: string, errorId: string, errorMessage?: string) {
    this.serviceId = serviceId;
    this.errorId = errorId;
    this.errorMessage = errorMessage;
  }

  create(payload: TPayload): ServiceError<TPayload> {
    return new ServiceError(this, payload);
  }

  formatMessage(payload: TPayload): string {
    let message = this.errorMessage;

    if (!message) {
      return JSON.stringify(payload);
    }

    for (const key of Object.keys(payload)) {
      message = message.replace(`{${key}}`, payload[key].toString());
    }

    return message;
  }

  equals(other: ServiceErrorPrototype<any>): boolean {
    if (!(other instanceof ServiceErrorPrototype)) {
      return false;
    }

    return other.serviceId === this.serviceId && other.errorId === this.errorId;
  }
}

export class ServiceError<TPayload extends ServiceErrorPayload> extends Error {
  readonly prototype: ServiceErrorPrototype<TPayload>;
  readonly payload: TPayload;

  constructor(prototype: ServiceErrorPrototype<TPayload>, payload: TPayload) {
    super(prototype.formatMessage(payload));
    this.prototype = prototype;
    this.payload = payload;
  }

  is(target: ServiceErrorPrototype<any> | ServiceError<any>): boolean {
    if (target instanceof ServiceErrorPrototype) {
      return target.equals(this.prototype);
    }

    if (target instanceof ServiceError) {
      if (!target.prototype.equals(this.prototype)) {
        return false;
      }

      if (
        Object.keys(target.payload).length !== Object.keys(this.payload).length
      ) {
        return false;
      }

      for (const key of Object.keys(this.payload)) {
        if (target.payload[key] !== this.payload[key]) {
          return false;
        }
      }

      return true;
    }

    return false;
  }
}
