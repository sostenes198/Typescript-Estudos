import { ServiceIdentifier } from '@/2-Commons/2-Application/IoC/Types/ServiceIdentifier';
import { ConfigureAction } from '@/2-Commons/2-Application/IoC/Types/ConfigureAction';
import { ScopeIoC } from '@/2-Commons/2-Application/IoC/Types/ScopeIoC';

export interface ServiceProvider extends Disposable {
    PostConfigureAction(action: ConfigureAction): void;

    AddScoped<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    AddScopedDynamic<T>(identifier: ServiceIdentifier, act: (provider: ServiceProvider) => T): void;

    TryAddScoped<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    TryAddScopedDynamic<T>(identifier: ServiceIdentifier, act: (provider: ServiceProvider) => T): void;

    AddSingleton<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    AddSingletonDynamic<T>(identifier: ServiceIdentifier, act: (provider: ServiceProvider) => T): void;

    TryAddSingleton<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    TryAddSingletonDynamic<T>(identifier: ServiceIdentifier, act: (provider: ServiceProvider) => T): void;

    RebindDynamic<T>(identifier: ServiceIdentifier, scope: ScopeIoC, act: (provider: ServiceProvider) => T): void;

    Get<T>(identifier: ServiceIdentifier): T;

    List<T>(identifier: ServiceIdentifier): Array<T>;

    CreateScope(): ServiceProvider;
}
