import { AnnotationsKey } from '@/2-Commons/2-Application/IoC/Annotations/Enums/AnnotationsKey';
import { EnumAssert } from '@test/base/Jest/EnumAssert';

describe('AnnotationsKey', () => {
    test('Should validate enums HttpMethod', () => {
        EnumAssert.Assert(AnnotationsKey, ['INJECT', 'INJECT_PARAM'], ['inject', 'inject-param']);
    });
});
