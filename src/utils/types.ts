export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export type MaybePromise<T> = T | Promise<T>;

export type Factory<T> = () => MaybePromise<T>;

export type MaybeFactory<T> = T | Factory<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FactoryReturnType<T extends MaybeFactory<any>> =
  T extends MaybeFactory<infer U> ? U : T;

export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : // eslint-disable-next-line @typescript-eslint/ban-types
  T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export type Prettify<T> = T extends object
  ? { [K in keyof T]: Prettify<T[K]> }
  : T;
