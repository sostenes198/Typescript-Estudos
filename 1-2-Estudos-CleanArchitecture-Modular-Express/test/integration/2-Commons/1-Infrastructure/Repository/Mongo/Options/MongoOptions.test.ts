import { MongoOptions } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Options/MongoOptions';
import BaseTest from '@test/integration/BaseTest';
import IocTypes from '@/2-Commons/2-Application/IoC/IoCTypes';
import { Options } from '@/2-Commons/2-Application/Options/Options';

describe('MongoOptions', () => {
    test('Should get and validate MongoOptions', () => {
        // arrange
        const expectedResult: MongoOptions = new MongoOptions();
        expectedResult.User = 'root';
        expectedResult.Password = 'Password';
        expectedResult.Server = 'mongodb://localhost';
        expectedResult.Port = 27017;
        expectedResult.DatabaseName = 'CleanArchitecture';

        // act
        const mongoOptions: MongoOptions = BaseTest.ServiceProvider.Get<Options<MongoOptions>>(IocTypes.MongoOption.Value).Value;

        // assert
        expect(mongoOptions).toEqual(expectedResult);
    });
});
