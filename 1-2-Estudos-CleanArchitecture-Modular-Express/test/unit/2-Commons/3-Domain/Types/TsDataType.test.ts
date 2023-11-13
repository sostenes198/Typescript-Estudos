import { TsDataType } from '@/2-Commons/3-Domain/Types/TsDataType';

describe('TsDataType', () => {
    it('Should validate type TsDataType', () => {
        // arrange - act
        const valueString: TsDataType = 'str';
        const valueNumber: TsDataType = 10;
        const valueBoolean: TsDataType = true;
        const valueUndefined: TsDataType = undefined;
        const valueNull: TsDataType = null;
        const valueSymbol: TsDataType = Symbol('VALUE');
        const valueObj: TsDataType = { prop1: 'PROP_1' };

        // assert
        expect(valueString).toStrictEqual('str');
        expect(valueNumber).toStrictEqual(10);
        expect(valueBoolean).toStrictEqual(true);
        expect(valueUndefined).toStrictEqual(undefined);
        expect(valueNull).toStrictEqual(null);
        expect((valueSymbol as symbol).description).toStrictEqual('VALUE');
        expect(valueObj).toStrictEqual({ prop1: 'PROP_1' });
    });
});
