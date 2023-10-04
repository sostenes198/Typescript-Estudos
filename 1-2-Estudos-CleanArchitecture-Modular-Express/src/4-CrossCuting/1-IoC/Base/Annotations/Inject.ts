import 'reflect-metadata';
import { injectable } from 'inversify';
import { v4 as uuidV4 } from 'uuid';
import { AnnotationsKey } from './Enums/AnnotationsKey';

export function Inject() {
    return function (constructor: new (...param: any[]) => object) {
        Reflect.defineMetadata(AnnotationsKey.INJECT, uuidV4(), constructor);
        injectable()(constructor);
    };
}
