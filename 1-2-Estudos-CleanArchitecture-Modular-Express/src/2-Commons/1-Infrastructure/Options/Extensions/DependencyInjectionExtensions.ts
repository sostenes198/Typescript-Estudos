import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';
import { Configuration } from '@/2-Commons/2-Application/Options/Configuration';
import IocTypes from '@/2-Commons/2-Application/IoC/IoCTypes';
import { ConfigurationProvider } from '@/2-Commons/2-Application/Options/ConfigurationProvider';
import { ConfigurationNConfProvider } from '@/2-Commons/1-Infrastructure/Options/ConfigurationNConfProvider';
import { Options } from '@/2-Commons/2-Application/Options/Options';
import { OptionsImp } from '@/2-Commons/1-Infrastructure/Options/OptionsImp';
import { ServiceIdentifier } from '@/2-Commons/2-Application/IoC/Types/ServiceIdentifier';

export class DependencyInjectionExtensions {
    public static AddConfigurationProvider(service: ServiceProvider, act: (configurationRootProvider: ConfigurationProvider) => void) {
        service.TryAddSingletonDynamic<Configuration>(IocTypes.Configuration.Value, () => {
            const configurationProvider = new ConfigurationNConfProvider();
            act(configurationProvider);
            return configurationProvider.Build();
        });
    }

    public static AddOptions<TOptions extends object>(service: ServiceProvider, identifier: ServiceIdentifier, pathObj: string) {
        service.TryAddSingletonDynamic<Options<TOptions>>(identifier, (provider: ServiceProvider) => {
            const configuration = provider.Get<Configuration>(IocTypes.Configuration.Value);
            const opt = configuration.Get<TOptions>(pathObj);
            return new OptionsImp<TOptions>(opt);
        });
    }
}
