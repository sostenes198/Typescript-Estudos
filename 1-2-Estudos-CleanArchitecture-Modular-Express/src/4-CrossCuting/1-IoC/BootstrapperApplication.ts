import { ConfigureAction } from '@/2-Commons/1-Infrastructure/IoC/Types/ConfigureAction';
import { ServiceProvider } from '@/2-Commons/1-Infrastructure/IoC/Interfaces/ServiceProvider';
import { AppContainerInversify } from './Inversify/AppContainerInversify';

export class BootstrapperApplication {
    private constructor() {}

    public static InitializeApplication(configureAction?: ConfigureAction): ServiceProvider {
        configureAction = configureAction ?? (() => {});
        return new AppContainerInversify([configureAction, (serviceProvider) => this.AddDependencies(serviceProvider)], undefined, {});
    }

    // TODO REFATORAR AQUI
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static AddDependencies(serviceProvider: ServiceProvider) {}
}
