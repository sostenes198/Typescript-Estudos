import { Configuration } from '@/2-Commons/2-Application/Options/Configuration';
import { Inject } from '@/2-Commons/2-Application/IoC/Annotations/Inject';
import nconf from 'nconf';

@Inject()
export class ConfigurationNConf implements Configuration {
    public Get<T>(key: string): T {
        return nconf.get(key);
    }
}
