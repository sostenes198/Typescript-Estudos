/* eslint-disable */
export type JestMockedObj<T> = {
  [K in keyof T]: T[K] extends JestMockedObj<K>
    ? jest.Mock
    : T[K] extends (...args: any[]) => any
    ? jest.Mock
    : T[K] extends object
    ? JestMockedObj<T[K]>
    : T[K];
};
