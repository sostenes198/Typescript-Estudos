import IocTypes from '@/2-Commons/2-Application/IoC/IoCTypes';

describe('IocTypes', () => {
    test('Should get ConfigurationRoot', () => {
        // arrange - act - assert
        expect(IocTypes.Configuration.Value).toStrictEqual('Configuration');
    });
});
