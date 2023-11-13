import { ServiceIdentifier } from '@/2-Commons/2-Application/IoC/Types/ServiceIdentifier';

describe('ServiceIdentifier', () => {
    test('Should validate type ServiceIdentifier', () => {
        // arrange - act - assert
        const strValue: ServiceIdentifier = 'StrTestValue';
        const symbolValue: ServiceIdentifier = Symbol('SimbolValue');

        expect(typeof strValue).toStrictEqual('string');
        expect(typeof symbolValue).toStrictEqual('symbol');
    });
});
