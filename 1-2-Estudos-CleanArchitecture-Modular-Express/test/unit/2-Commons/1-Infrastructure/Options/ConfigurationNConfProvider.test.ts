import nconf from 'nconf';
import { ConfigurationNConfProvider } from '@/2-Commons/1-Infrastructure/Options/ConfigurationNConfProvider';
import { ConfigurationProvider } from '@/2-Commons/2-Application/Options/ConfigurationProvider';
import { Configuration } from '@/2-Commons/2-Application/Options/Configuration';
import '@test/base/Jest/Extensions';

describe('ConfigurationNConfProvider', () => {
    const jsonFile: string = `${__dirname}/Fixtures/test.config.json`;

    afterEach(() => {
        nconf.remove(jsonFile);
    });

    test('Should add JsonProvider and build', () => {
        // arrange
        const configurationNConfProvider: ConfigurationProvider = new ConfigurationNConfProvider();

        // act
        configurationNConfProvider.AddJsonProvider(jsonFile);

        const configuration: Configuration = configurationNConfProvider.Build();

        // assert
        expect(configuration).not.BeNullOrUndefined();
    });
});
