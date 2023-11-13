import { StringUtils } from '@/2-Commons/3-Domain/Utils/StringUtils';
import { TsDataType } from '@/2-Commons/3-Domain/Types/TsDataType';

describe('StringUtils', () => {
    it.each([
        ['', true],
        ['STRING', false],
        [0, true],
        [123, false],
        [false, true],
        [true, false],
        [undefined, true],
        [null, true],
        [Symbol(''), true],
        [Symbol('SYMBOL'), false],
        [{}, true],
        [{ prop1: 'VALUE' }, false],
    ])('Should validate value isNullUndefinedOrEmpty | Value: %s | ExpectedValue: %s', (obj: TsDataType, expectedResult: boolean) => {
        // arrange - act
        const result = StringUtils.IsNullUndefinedOrEmpty(obj);

        // assert
        expect(result).toStrictEqual(expectedResult);
    });
});
