import 'reflect-metadata';
import { JsonConverterAnnotation } from './json.converter.annotation';

export const jsonPropertyName = (propertyName: string) => {
  return function (target: object, propertyKey: string) {
    Reflect.defineMetadata(
      JsonConverterAnnotation.PROPERTY_NAME,
      propertyName,
      target,
      propertyKey,
    );
  };
};

export const jsonIgnoreProperty = () => {
  return function (target: object, propertyKey: string) {
    Reflect.defineMetadata(
      JsonConverterAnnotation.IGNORE_PROPERTY,
      true,
      target,
      propertyKey,
    );
  };
};
