import 'reflect-metadata';
import { Inject } from '@/4-CrossCuting/1-IoC/Base/Annotations/Inject';
import { AnnotationsKey } from '@/4-CrossCuting/1-IoC/Base/Annotations/Enums/AnnotationsKey';

class InjectUniTestClass {}

describe('Inject', () => {
    test('Should use decorator Inject', () => {
        // arrange

        // Act
        Inject()(InjectUniTestClass);

        const metadata = Reflect.getMetadata(AnnotationsKey.INJECT, InjectUniTestClass);

        // Assert
        expect(metadata).not.toBeNull();
        expect(metadata).not.toBeUndefined();
    });
});
