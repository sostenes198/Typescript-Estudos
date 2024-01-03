export type AssertPropertiesTypes =
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'undefined'
  | 'null'
  | 'symbol'
  | 'object'
  | 'function';

export interface AssertPropertiesObj {
  propertyName: string;
  typeProperty: AssertPropertiesTypes;
}
