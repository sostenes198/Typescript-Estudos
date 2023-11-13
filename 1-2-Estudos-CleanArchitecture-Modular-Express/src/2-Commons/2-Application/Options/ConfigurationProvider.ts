import { Configuration } from '@/2-Commons/2-Application/Options/Configuration';

export interface ConfigurationProvider {
    AddJsonProvider(jsonFilePath: string): ConfigurationProvider;
    Build(): Configuration;
}
