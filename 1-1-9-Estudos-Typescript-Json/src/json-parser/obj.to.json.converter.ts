import { JsonConverterAnnotation } from './json.converter.annotation';

const _ignoreProperty = (obj: object, key: string): boolean => {
  return Reflect.getMetadata(JsonConverterAnnotation.IGNORE_PROPERTY, obj, key)
    || !Reflect.getMetadata(JsonConverterAnnotation.PROPERTY_NAME, obj, key) // Validação para ignorar propriedades que não estejam com o DECORADAS
};

const _getPropertyOrDefault = (obj: object, key: string): string => {
  const jsonPropertyName = Reflect.getMetadata(
    JsonConverterAnnotation.PROPERTY_NAME,
    obj,
    key,
  );

  if (!jsonPropertyName) return key;
  return jsonPropertyName;
};

export const objToJsonConverter = <T extends object>(obj: T): string => {
  return JSON.stringify(obj, (_: string, value: unknown): unknown => {
    if (value && typeof value === 'object') {
      const obj: object = value!;
      const replacement: Record<string, unknown> = {};

      Object.keys(obj).forEach((key: string): void => {
        if (_ignoreProperty(obj, key)) return;

        const jsonPropertyName = _getPropertyOrDefault(obj, key);
        replacement[key && jsonPropertyName] = obj[key as keyof typeof obj];
      });

      return replacement;
    }
    return value;
  });
};
