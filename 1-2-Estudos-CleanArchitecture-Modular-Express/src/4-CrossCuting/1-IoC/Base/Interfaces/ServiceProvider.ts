import { ServiceIdentifier } from '@/4-CrossCuting/1-IoC/Base/Types/ServiceIdentifier';
import { ConfigureAction } from '@/4-CrossCuting/1-IoC/Base/Types/ConfigureAction';

export interface ServiceProvider extends Disposable {
    PostConfigureAction(action: ConfigureAction): void;

    TryAddTransientScope<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    TryAddSingletonScope<T>(identifier: ServiceIdentifier, target: new (...param: any[]) => T): void;

    Get<T>(identifier: ServiceIdentifier): T;

    CreateScope(): ServiceProvider;
}
