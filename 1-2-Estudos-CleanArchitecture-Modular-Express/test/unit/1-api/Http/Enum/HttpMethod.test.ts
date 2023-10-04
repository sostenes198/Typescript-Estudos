import { EnumAssert } from '@test/base/Jest/EnumAssert';
import { HttpMethod } from '@/1-Api/Http/Enum/HttpMethod';

describe('HttpMethod', () => {
    test('Should validate enums HttpMethod', () => {
        EnumAssert.Assert(HttpMethod, ['GET', 'POST', 'PUT', 'DELETE'], ['GET', 'POST', 'PUT', 'DELETE']);
    });
});
