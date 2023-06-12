/* eslint-disable @typescript-eslint/no-explicit-any */

export type InferServiceID<T extends ServiceInterface> = T['id'];

export type InferServiceEvents<T extends ServiceInterface> = T['events'];

export type InferServiceErrors<T extends ServiceInterface> = T['errors'];

export type InferServiceFunctions<T extends ServiceInterface> = T['functions'];

export type ServiceInterface<
  TID extends string = any,
  TFunctions = any,
  TEvents extends Record<string, any> = any,
  TErrors extends Record<string, any> = any
> = {
  id: TID;
  functions: TFunctions;
  events: TEvents;
  errors: TErrors;
};

export type Service<T extends ServiceInterface = any> =
  InferServiceFunctions<T>;
