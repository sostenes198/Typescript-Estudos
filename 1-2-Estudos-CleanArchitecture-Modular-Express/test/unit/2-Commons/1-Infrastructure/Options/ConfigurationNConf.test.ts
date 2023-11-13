import nconf from 'nconf';
import { Configuration } from '@/2-Commons/2-Application/Options/Configuration';
import '@test/base/Jest/Extensions';
import { ConfigurationNConf } from '@/2-Commons/1-Infrastructure/Options/ConfigurationNConf';

describe('ConfigurationNConf', () => {
    const jsonFile: string = `${__dirname}/Fixtures/test.config.json`;

    beforeEach(() => {
        nconf.file(jsonFile);
    });

    afterEach(() => {
        nconf.remove(jsonFile);
    });

    test('Should validate Get prop from nconf', () => {
        // arrange
        const configuration: Configuration = new ConfigurationNConf();

        // act
        const propResult = configuration.Get<string>('prop1');

        // assert
        expect(propResult).toStrictEqual('PROP1');
    });
});
