/* eslint-disable @typescript-eslint/no-unused-vars */
import { default as express, NextFunction, Request, Response } from 'express';
import { ServiceError } from '../../../../core';

export function responseNotFound() {
    return express.Router().use('*', (_req: Request, res: Response) => {
        return res.status(404).send({
            error: 'not-found',
            message: 'api path not found'
        });
    });
}

export function responseHealthCheck() {
    return express.Router().get('/', (_req: Request, res: Response) => {
        return res.status(200).send();
    });
}

export function responseServiceError() {
    return (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error(err);
        if (!err) {
            return res.status(204).send();
        }

        if (!(err instanceof ServiceError)) {
            return res.status(500).send({
                error: 'internal-error',
                message: err.name
            });
        }

        const serviceErr = err as ServiceError;
        const isNoResource = serviceErr.is({
            errorId: 'NO_RESOURCE'
        });

        if (isNoResource) {
            return res.status(404).send({
                error: 'not-found',
                message: err
            });
        }

        const isUnauthorized = serviceErr.is({
            errorId: 'UNAUTHORIZED'
        });

        if (isUnauthorized) {
            return res.status(401).send({
                error: 'unauthorized',
                message: err
            });
        }

        return res.status(400).send({
            error: 'bad-request',
            message: err
        });
    };
}

export function responseContentType() {
    return (_req: Request, res: Response, next: NextFunction) => {
        res.header('Content-Type', 'application/json');
        next();
    };
}

export function injectDependencies(deps: unknown) {
    return (_req: Request, res: Response, next: NextFunction) => {
        res.locals.deps = deps;
        next();
    };
}

export function responseSpec(filePath: string) {
    return express.Router().get('/spec', (_req: Request, res: Response) => {
        return res.sendFile(filePath);
    });
}
