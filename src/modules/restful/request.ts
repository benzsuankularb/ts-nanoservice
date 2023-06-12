import express from 'express';

export function useDependencies<T>(req: express.Request) {
  return req.res?.locals['deps'] as T;
}

export function useToken(req: express.Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (req as any)['user'] as string;
}

export function useIPAddress(req: express.Request) {
  return (req.headers['X-Forwarded-For'] as string) ?? '';
}
