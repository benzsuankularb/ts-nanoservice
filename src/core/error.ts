/* eslint-disable @typescript-eslint/no-explicit-any */
export class ServiceError<
    T extends Record<string, any> = Record<string, any>
> extends Error {
    readonly serviceId: string;
    readonly errorId: string;
    readonly payloads?: T;
    readonly innerError?: Error;

    constructor(options: {
        serviceId: string;
        errorId: string;
        payloads?: T;
        inner?: Error;
    }) {
        super();
        this.serviceId = options.serviceId;
        this.errorId = options.errorId;
        this.payloads = options.payloads;
        this.innerError = options.inner;
        this.stack = options?.inner?.stack;
    }

    is(options: { serviceId?: string; errorId?: string; payloads?: T }) {
        if (options.serviceId && this.serviceId !== options.serviceId) {
            return false;
        }

        if (options.errorId && this.errorId !== options.errorId) {
            return false;
        }

        if (!this.payloads || !options.payloads) {
            return true;
        }

        if (this.payloads instanceof Object) {
            if (
                Object.keys(options.payloads).length !==
                Object.keys(this.payloads).length
            ) {
                return false;
            }

            for (const key of Object.keys(this.payloads)) {
                if (options.payloads[key] !== this.payloads[key]) {
                    return false;
                }
            }
        }

        return true;
    }

    equals(obj: unknown): boolean {
        if (!(obj instanceof ServiceError)) {
            return false;
        }

        return this.is({
            serviceId: obj.serviceId,
            errorId: obj.errorId,
            payloads: obj.payloads
        });
    }
}
