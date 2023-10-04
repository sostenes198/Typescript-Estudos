import { ConfigureAction } from './Base/Types/ConfigureAction';
import { ServiceProvider } from './Base/Interfaces/ServiceProvider';
import { AppContainerInversify } from './Inversify/AppContainerInversify';

export class BootstrapperApplication {
    private constructor() {}

    public static InitializeApplication(configureAction?: ConfigureAction): ServiceProvider {
        configureAction = configureAction ?? (() => {});
        return new AppContainerInversify([configureAction, (serviceProvider) => this.AddDependencies(serviceProvider)], undefined, {});
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static AddDependencies(serviceProvider: ServiceProvider) {}
}
