/* eslint-disable @typescript-eslint/no-explicit-any */
import { IServiceCollection } from '../dy-abstractions';
import { Constructor, MetadataKeys } from '../dy-abstractions/definitions';

export class ServiceCollection implements IServiceCollection {
  Add<TImp>(typeImp: Constructor<TImp>): IServiceCollection;
  Add<TInterface, TImp extends TInterface>(typeImp: Constructor<TImp>): IServiceCollection;
  Add(typeImp: Constructor<any>): IServiceCollection {
    const x = Reflect.getMetadata(MetadataKeys.DY_INJECTOR_RESOURCE, typeImp);
    console.log(x);
    return undefined;
  }


}