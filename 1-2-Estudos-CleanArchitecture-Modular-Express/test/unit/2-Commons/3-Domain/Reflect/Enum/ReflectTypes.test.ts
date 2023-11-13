import { EnumAssert } from '@test/base/Jest/EnumAssert';
import { ReflectTypes } from '@/2-Commons/3-Domain/Reflect/Enum/ReflectTypes';

describe('ReflectTypes', () => {
    test('Should validate enums HttpMethod', () => {
        EnumAssert.Assert(ReflectTypes, ['TYPE', 'PARAM_TYPE', 'RETURN_TYPE'], ['design:type', 'design:paramtypes', 'design:returntype']);
    });
});
