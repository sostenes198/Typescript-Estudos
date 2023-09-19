import { MetadataControllerKey } from '@/1-api/aop/controller/enum/MetadataControllerKey';
import { EnumAssert } from '@test/base/jest/EnumAssert';

describe('MetadataControllerKey', () => {
    test('Should validate enums MetadataControllerKey', () => {
        // arrange - act - assert
        EnumAssert.Assert(
            MetadataControllerKey,
            ['CONTROLLER_ID', 'CONTROLLER_PATH', 'CONTROLLER_METHOD', 'CONTROLLER_METHOD_PATH'],
            ['controller.method.id', 'controller.path', 'controller.method', 'controller.method.path'],
        );
    });
});
