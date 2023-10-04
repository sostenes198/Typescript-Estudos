import { AnnotationsKey } from '../../../../../../../src/4-CrossCuting/1-IoC/Base/Annotations/Enums/AnnotationsKey';
import { EnumAssert } from '../../../../../../base/Jest/EnumAssert';

describe('AnnotationsKey', () => {
    test('Should validate enums HttpMethod', () => {
        EnumAssert.Assert(AnnotationsKey, ['INJECT'], ['inject']);
    });
});
