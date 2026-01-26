export type ErrorHandler<T> = (error: Error) => T | Promise<T>;
