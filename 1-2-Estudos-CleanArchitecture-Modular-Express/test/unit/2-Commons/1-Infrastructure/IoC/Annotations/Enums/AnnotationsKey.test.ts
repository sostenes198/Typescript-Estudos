import { AnnotationsKey } from '@/2-Commons/1-Infrastructure/IoC/Annotations/Enums/AnnotationsKey';
import { EnumAssert } from '@test/base/Jest/EnumAssert';

describe('AnnotationsKey', () => {
    test('Should validate enums HttpMethod', () => {
        EnumAssert.Assert(AnnotationsKey, ['INJECT'], ['inject']);
    });
});
