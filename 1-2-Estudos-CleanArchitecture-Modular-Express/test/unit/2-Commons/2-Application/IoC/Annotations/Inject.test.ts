import 'reflect-metadata';
import { Inject, InjectMultiParam, InjectParam } from '@/2-Commons/2-Application/IoC/Annotations/Inject';
import { AnnotationsKey } from '@/2-Commons/2-Application/IoC/Annotations/Enums/AnnotationsKey';

const identifierInjectParamTest: string = 'identifierInjectParamTest';
const identifierMultiInjectParamTest: string = 'identifierMultiInjectParamTest';

class ParamTest {}

class InjectUniTestClass {
    constructor(
        @InjectParam(identifierInjectParamTest) private readonly testParam: ParamTest,
        @InjectMultiParam(identifierMultiInjectParamTest) private readonly multiInjectTestParam: ParamTest[],
    ) {}

    public get TestParam(): ParamTest {
        return this.testParam;
    }

    public get MultiInjectTestParam(): ParamTest[] {
        return this.multiInjectTestParam;
    }
}

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

    test('Should use decorator InjectParam', () => {
        // arrange

        // act
        const metadata = Reflect.getMetadata(AnnotationsKey.INJECT_PARAM, InjectUniTestClass, '0:ParamTest');

        // assert
        expect(metadata).not.toBeNull();
        expect(metadata).not.toBeUndefined();
    });

    test('Should use decorator InjectMultiParam', () => {
        // arrange

        // act
        const metadata = Reflect.getMetadata(AnnotationsKey.INJECT_PARAM, InjectUniTestClass, '1:Array');

        // assert
        expect(metadata).not.toBeNull();
        expect(metadata).not.toBeUndefined();
    });
});
