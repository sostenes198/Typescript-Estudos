import { TypeOfDefinition } from '../definitions';

export class InjectorResourceParameter {
  private readonly _identifier: string;
  private readonly _typeParam: TypeOfDefinition;
  private readonly _isArray: boolean;

  constructor(identifier: string, typeParam: unknown) {
    this._identifier = identifier;
    this._typeParam = typeof typeParam;
    this._isArray = Array.isArray(typeParam);
  }

  public get identifier(): string {
    return this._identifier;
  }

  public get typeParam(): TypeOfDefinition {
    return this._typeParam;
  }

  public get isArray(): boolean {
    return this._isArray;
  }
}