import 'reflect-metadata';
import { inject, injectable, multiInject } from 'inversify';
import { v4 as uuidV4 } from 'uuid';
import { AnnotationsKey } from './Enums/AnnotationsKey';
import { ReflectTypes } from '@/2-Commons/3-Domain/Reflect/Enum/ReflectTypes';

export function Inject() {
    return function (constructor: new (...param: any[]) => object) {
        Reflect.defineMetadata(AnnotationsKey.INJECT, uuidV4(), constructor);
        injectable()(constructor);
    };
}

export function InjectParam(identifier: string) {
    return function (target: new (...args: any[]) => object, parameterKeyParam: string | symbol | undefined, parameterIndex: number) {
        const types = Reflect.getMetadata(ReflectTypes.PARAM_TYPE, target);
        const propertyKey = `${parameterIndex}:${types[parameterIndex].name}`;
        inject(identifier)(target, parameterKeyParam, parameterIndex);
        Reflect.defineMetadata(AnnotationsKey.INJECT_PARAM, identifier, target, propertyKey);
    };
}

export function InjectMultiParam(identifier: string) {
    return function (target: new (...args: any[]) => object, parameterKeyParam: string | symbol | undefined, parameterIndex: number) {
        const types = Reflect.getMetadata(ReflectTypes.PARAM_TYPE, target);
        const propertyKey = `${parameterIndex}:${types[parameterIndex].name}`;
        multiInject(identifier)(target, parameterKeyParam, parameterIndex);
        Reflect.defineMetadata(AnnotationsKey.INJECT_PARAM, identifier, target, propertyKey);
    };
}
