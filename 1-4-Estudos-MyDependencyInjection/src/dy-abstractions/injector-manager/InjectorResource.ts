import { InjectorResourceParameter } from './InjectorResourceParameter';

export class InjectorResource {
  private readonly _name: string;
  private readonly _resourceParameters: Array<InjectorResourceParameter>;

  constructor(name: string, resourceParameters: Array<InjectorResourceParameter>) {
    this._name = name;
    this._resourceParameters = resourceParameters;
  }
}