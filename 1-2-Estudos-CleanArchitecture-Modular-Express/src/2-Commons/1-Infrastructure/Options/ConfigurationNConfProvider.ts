import { Inject } from '@/2-Commons/2-Application/IoC/Annotations/Inject';
import { ConfigurationProvider } from '@/2-Commons/2-Application/Options/ConfigurationProvider';
import { Configuration } from '@/2-Commons/2-Application/Options/Configuration';
import nconf from 'nconf';
import { ConfigurationNConf } from '@/2-Commons/1-Infrastructure/Options/ConfigurationNConf';

@Inject()
export class ConfigurationNConfProvider implements ConfigurationProvider {
    public AddJsonProvider(jsonFilePath: string): ConfigurationProvider {
        nconf.file({ file: jsonFilePath });

        return this;
    }

    Build(): Configuration {
        return new ConfigurationNConf();
    }
}
