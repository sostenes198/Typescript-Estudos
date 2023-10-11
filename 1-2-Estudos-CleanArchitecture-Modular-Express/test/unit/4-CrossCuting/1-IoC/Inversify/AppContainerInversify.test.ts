import { AppContainerInversify } from '@/4-CrossCuting/1-IoC/Inversify/AppContainerInversify';
import { ConfigureAction } from '@/2-Commons/1-Infrastructure/IoC/Types/ConfigureAction';
import { v4 as uuidV4 } from 'uuid';
import { Inject } from '@/2-Commons/1-Infrastructure/IoC/Annotations/Inject';
import '@test/base/Jest/Extensions';

interface UnitTestDependency {
    Id: string;
}

@Inject()
class UnitTestDependencyClass implements UnitTestDependency {
    Id: string = uuidV4();
}

describe('AppContainerInversify', () => {
    let executedGlobalAction: number;
    let globalAction: ConfigureAction;
    let container: AppContainerInversify;

    beforeEach(() => {
        executedGlobalAction = 0;
        globalAction = () => {
            executedGlobalAction++;
        };
        container = new AppContainerInversify([globalAction]);
    });

    test('Should execute post configure actions', () => {
        // arrange
        let countAssert = 0;

        // act
        container.PostConfigureAction(() => {
            countAssert++;
        });

        // assert
        expect(container['_configureActions'].length).toStrictEqual(2);
        expect(countAssert).toStrictEqual(1);

        expect(executedGlobalAction).toStrictEqual(1);
    });

    test('Should add transient dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.AddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const result = container.List<UnitTestDependency>(serviceIdentifier);

        const ids = result.map((value) => value.Id);

        // assert
        expect(result.length).toStrictEqual(3);
        expect(ids).toBeDistinctArray();
    });

    test('Should try add transient dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.TryAddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.TryAddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.TryAddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const result = container.List<UnitTestDependency>(serviceIdentifier);

        // assert

        expect(result.length).toStrictEqual(1);
        expect(result[0].Id).not.BeNullOrUndefined();
    });

    test('Should add singleton dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.AddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const result = container.List<UnitTestDependency>(serviceIdentifier);

        const ids = result.map((value) => value.Id);

        // assert
        expect(result.length).toStrictEqual(3);
        expect(ids).toBeDistinctArray();
    });

    test('Should try add singleton dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.TryAddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.TryAddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.TryAddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const result = container.List<UnitTestDependency>(serviceIdentifier);

        // assert

        expect(result.length).toStrictEqual(1);
        expect(result[0].Id).not.BeNullOrUndefined();
    });

    test('Should get transient dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.TryAddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const dependency1 = container.Get<UnitTestDependency>(serviceIdentifier);
        const dependency2 = container.Get<UnitTestDependency>(serviceIdentifier);

        // assert
        expect(dependency1.Id).not.toStrictEqual(dependency2.Id);
    });

    test('Should get singleton dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.TryAddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const dependency1 = container.Get<UnitTestDependency>(serviceIdentifier);
        const dependency2 = container.Get<UnitTestDependency>(serviceIdentifier);

        // assert
        expect(dependency1.Id).toStrictEqual(dependency2.Id);
    });

    test('Should list transient dependencies', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.AddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddTransient<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const dependency1 = container.List<UnitTestDependency>(serviceIdentifier);
        const dependency2 = container.List<UnitTestDependency>(serviceIdentifier);

        // assert
        expect(dependency1).not.toBeEqualsArrays(dependency2);
    });

    test('Should list singleton dependencies', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.AddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddSingleton<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const dependency1 = container.List<UnitTestDependency>(serviceIdentifier);
        const dependency2 = container.List<UnitTestDependency>(serviceIdentifier);

        // assert
        expect(dependency1).toBeEqualsArrays(dependency2);
    });

    test('Should create scope', () => {
        // arrange
        const serviceIdentifierTransient = uuidV4();
        const serviceIdentifierSingleton = uuidV4();

        // act
        container.TryAddTransient<UnitTestDependency>(serviceIdentifierTransient, UnitTestDependencyClass);
        container.TryAddSingleton<UnitTestDependency>(serviceIdentifierSingleton, UnitTestDependencyClass);

        const scope1 = container.CreateScope();
        const scope2 = container.CreateScope();

        const containerDependencyTransient = container.Get<UnitTestDependency>(serviceIdentifierTransient);
        const scope1DependencyTransient = scope1.Get<UnitTestDependency>(serviceIdentifierTransient);
        const scope2DependencyTransient = scope2.Get<UnitTestDependency>(serviceIdentifierTransient);

        const containerDependencySingleton = container.Get<UnitTestDependency>(serviceIdentifierSingleton);
        const scope1DependencySingleton = scope1.Get<UnitTestDependency>(serviceIdentifierSingleton);
        const scope2DependencySingleton = scope2.Get<UnitTestDependency>(serviceIdentifierSingleton);

        // assert
        expect(containerDependencyTransient.Id).not.toStrictEqual(scope1DependencyTransient.Id);
        expect(containerDependencyTransient.Id).not.toStrictEqual(scope2DependencyTransient.Id);
        expect(scope1DependencyTransient.Id).not.toStrictEqual(scope2DependencyTransient.Id);

        expect(containerDependencySingleton.Id).toStrictEqual(scope1DependencySingleton.Id);
        expect(containerDependencySingleton.Id).toStrictEqual(scope2DependencySingleton.Id);
        expect(scope1DependencySingleton.Id).toStrictEqual(scope2DependencySingleton.Id);

        expect((container as AppContainerInversify)['_container'].id).not.toStrictEqual((scope1 as AppContainerInversify)['_container'].id);
        expect((container as AppContainerInversify)['_container'].id).not.toStrictEqual((scope2 as AppContainerInversify)['_container'].id);
        expect((scope1 as AppContainerInversify)['_container'].id).not.toStrictEqual((scope2 as AppContainerInversify)['_container'].id);
    });

    test('Should dispose scope', () => {
        // arrange
        const scope1 = container.CreateScope();
        const scope2 = container.CreateScope();

        // act
        scope1[Symbol.dispose]();
        scope2[Symbol.dispose]();

        // assert
        expect((scope1 as AppContainerInversify)['_container']).BeNullOrUndefined();
        expect((scope2 as AppContainerInversify)['_container']).BeNullOrUndefined();
    });
});
