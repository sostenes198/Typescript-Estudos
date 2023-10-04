import { ServiceIdentifier } from '@/4-CrossCuting/1-IoC/Base/Types/ServiceIdentifier';

describe('ServiceIdentifier', () => {
    test('Should validate type ServiceIdentifier', () => {
        // arrange - act - assert
        const strValue: ServiceIdentifier = 'StrTestValue';
        const symbolValue: ServiceIdentifier = Symbol('SimbolValue');

        expect(typeof strValue).toStrictEqual('string');
        expect(typeof symbolValue).toStrictEqual('symbol');
    });
});
