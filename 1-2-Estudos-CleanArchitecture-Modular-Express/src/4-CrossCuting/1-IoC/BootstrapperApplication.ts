import { ConfigureAction } from '@/2-Commons/2-Application/IoC/Types/ConfigureAction';
import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';
import { AppContainerInversify } from './Inversify/AppContainerInversify';
import { DependencyInjectionExtensions as dpOptions } from '@/2-Commons/1-Infrastructure/Options/Extensions/DependencyInjectionExtensions';
import { DependencyInjectionExtensions as dbMongoRepository } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Extensions/DependencyInjectionExtensions';
import { ConfigurationProvider } from '@/2-Commons/2-Application/Options/ConfigurationProvider';

export class BootstrapperApplication {
    private constructor() {}

    public static InitializeApplication(jsonFilePath: string, configureAction?: ConfigureAction): ServiceProvider {
        configureAction = configureAction ?? (() => {});
        return new AppContainerInversify([configureAction, (serviceProvider) => this.AddDependencies(serviceProvider, jsonFilePath)], undefined, {});
    }

    private static AddDependencies(serviceProvider: ServiceProvider, jsonFilePath: string) {
        dpOptions.AddConfigurationProvider(serviceProvider, (provider: ConfigurationProvider) => {
            provider.AddJsonProvider(jsonFilePath);
        });

        dbMongoRepository.AddMongoService(serviceProvider);
    }
}
