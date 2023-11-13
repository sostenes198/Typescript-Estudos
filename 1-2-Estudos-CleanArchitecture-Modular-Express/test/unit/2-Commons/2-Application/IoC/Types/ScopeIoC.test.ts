import { EnumAssert } from '@test/base/Jest/EnumAssert';
import { ScopeIoC } from '@/2-Commons/2-Application/IoC/Types/ScopeIoC';

describe('ScopeIoC', () => {
    test('Should validate enums ScopeIoC', () => {
        // arrange - act - assert
        EnumAssert.Assert(ScopeIoC, ['SCOPED', 'SINGLETON'], ['scoped', 'singleton']);
    });
});
