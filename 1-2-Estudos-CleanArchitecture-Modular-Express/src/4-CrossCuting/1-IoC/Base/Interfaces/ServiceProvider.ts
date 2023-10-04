import { ServiceIdentifier } from '../Types/ServiceIdentifier';
import { ConfigureAction } from '../Types/ConfigureAction';

export interface ServiceProvider extends Disposable {
    PostConfigureAction(action: ConfigureAction): void;

    TryAddTransientScope<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    TryAddSingletonScope<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    Get<T>(identifier: ServiceIdentifier): T;

    CreateScope(): ServiceProvider;
}
