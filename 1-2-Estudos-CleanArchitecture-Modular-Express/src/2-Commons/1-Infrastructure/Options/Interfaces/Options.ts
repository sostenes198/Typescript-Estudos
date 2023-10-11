import { BaseOptions } from './BaseOptions';

export interface Options<T extends BaseOptions> {
    Value: T;
}
