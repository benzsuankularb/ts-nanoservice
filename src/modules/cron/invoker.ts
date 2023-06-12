import express from 'express';

export type CronInvoker = (invoke: () => void) => void;

export interface LocalInvokerOptions {
  interval: number;
}

export function createLocalInvoker(options: LocalInvokerOptions): CronInvoker {
  return (invoke: () => void) => {
    invoke();
    setInterval(() => {}, options.interval);
  };
}

export interface HookInvokerOptions {
  router: express.Router;
}

export function createHookInvoker(options: HookInvokerOptions): CronInvoker {
  return (invoke: () => void) => {
    options.router.get('', (_, resp) => {
      invoke();
      resp.send(200);
    });
  };
}
