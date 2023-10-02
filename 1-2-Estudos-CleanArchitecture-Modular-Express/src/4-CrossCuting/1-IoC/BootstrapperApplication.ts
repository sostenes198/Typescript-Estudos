import { ConfigureAction } from '@/4-CrossCuting/1-IoC/Base/Types/ConfigureAction';
import { ServiceProvider } from '@/4-CrossCuting/1-IoC/Base/Interfaces/ServiceProvider';
import { AppContainerInversify } from '@/4-CrossCuting/1-IoC/Inversify/AppContainerInversify';

export class BootstrapperApplication {
    private constructor() {}

    public static InitializeApplication(configureAction?: ConfigureAction): ServiceProvider {
        configureAction = configureAction ?? (() => {});
        return new AppContainerInversify([configureAction, (serviceProvider) => this.AddDependencies(serviceProvider)], undefined, {});
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static AddDependencies(serviceProvider: ServiceProvider) {}
}
