import { ServiceIdentifier } from '../Types/ServiceIdentifier';
import { ConfigureAction } from '../Types/ConfigureAction';

export interface ServiceProvider {
    PostConfigureAction(action: ConfigureAction): void;

    AddTransient<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    TryAddTransient<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    AddSingleton<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    TryAddSingleton<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    Get<T>(identifier: ServiceIdentifier): T;

    List<T>(identifier: ServiceIdentifier): Array<T>;

    CreateScope(): ServiceProvider;
}
