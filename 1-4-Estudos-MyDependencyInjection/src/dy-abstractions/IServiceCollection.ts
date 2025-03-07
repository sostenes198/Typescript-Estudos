// import { IServiceProvider } from './IServiceProvider';

import { Constructor } from './injector-manager';

export interface IServiceCollection {
  Add<TImp>(typeImp: Constructor<TImp>): IServiceCollection;
  Add<TInterface, TImp extends TInterface>(typeImp: Constructor<TImp>): IServiceCollection;

  // Add(x: string): IServiceCollection;
  //
  // Add(x: number): IServiceCollection;
  //
  // TryAdd(): IServiceCollection;
  //
  // AddTransient(): IServiceCollection;
  //
  // TryAddTransient(): IServiceCollection;
  //
  // AddScoped(): IServiceCollection;
  //
  // TryAddScoped(): IServiceCollection;
  //
  // AddSingleton(): IServiceCollection;
  //
  // TryAddSingleton(): IServiceCollection;
  //
  // Build(): IServiceProvider;
}