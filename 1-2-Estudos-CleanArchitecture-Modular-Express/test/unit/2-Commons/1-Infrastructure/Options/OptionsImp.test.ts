import { OptionsImp } from '@/2-Commons/1-Infrastructure/Options/OptionsImp';
import { TestValueOpt } from '@test/unit/2-Commons/1-Infrastructure/Options/Fixtures/TestValueOpt';

describe('OptionsImp', () => {
    test('Should validate OptionsImp', () => {
        // arrange
        const expectedValueResult: TestValueOpt = { prop1: 'prop1', prop2: 'prop2', prop3: 'prop3' };

        // act
        const opt = new OptionsImp<TestValueOpt>({ prop1: 'prop1', prop2: 'prop2', prop3: 'prop3' });

        // assert
        expect(opt.Value).toStrictEqual(expectedValueResult);
    });
});
