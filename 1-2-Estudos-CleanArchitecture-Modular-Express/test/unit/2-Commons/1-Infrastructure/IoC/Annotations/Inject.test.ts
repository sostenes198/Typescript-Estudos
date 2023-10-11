import 'reflect-metadata';
import { Inject } from '@/2-Commons/1-Infrastructure/IoC/Annotations/Inject';
import { AnnotationsKey } from '@/2-Commons/1-Infrastructure/IoC/Annotations/Enums/AnnotationsKey';

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
