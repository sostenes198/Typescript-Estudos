/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { ErrorMessage, MetadataKeys } from '../definitions';
import { InjectorResource } from './InjectorResource';
import { InjectorResourceParameter } from './InjectorResourceParameter';

export function Injectable<T extends { new(...args: any[]) }>(target: T): void {
  if (!(target instanceof Function) || target.prototype === undefined) {
    throw new Error(`Decorator @Injectable must be a class.`);
  }

  if (Reflect.hasOwnMetadata(MetadataKeys.DY_CLASS_CONSTRUCTOR_INJECTION, target)) {
    throw new Error(ErrorMessage.DUPLICATED_INJECTABLE_DECORATOR);
  }

  const injectorResourceParameters: Array<InjectorResourceParameter> = [];

  const paramTypes = Reflect.getMetadata(MetadataKeys.DESIGN_PARAM_TYPES, target);
  paramTypes?.forEach((type: any, index: number) => {
    const identifier: string = Reflect.getMetadata(MetadataKeys.DY_INJECTOR_RESOURCE_PARAMETER, target, index.toString());
    injectorResourceParameters.push(new InjectorResourceParameter(identifier, type()));
  });

  Reflect.defineMetadata(MetadataKeys.DY_CLASS_CONSTRUCTOR_INJECTION, paramTypes, target);
  Reflect.defineMetadata(MetadataKeys.DY_INJECTOR_RESOURCE, new InjectorResource(target.name, injectorResourceParameters), target);
}

export function InjectableParam(identifier: string) {
  return function(target: object, propertyKey: string | symbol, parameterIndex: number) {
    if (propertyKey !== undefined) {
      throw new Error(ErrorMessage.ONLY_CONSTRUCTOR_INJECTABLE_PARAM_DECORATOR);
    }


    Reflect.defineMetadata(MetadataKeys.DY_INJECTOR_RESOURCE_PARAMETER, identifier, target, parameterIndex.toString());
  };
}