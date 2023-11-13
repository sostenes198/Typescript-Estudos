import { AppContainerInversify } from '@/4-CrossCuting/1-IoC/Inversify/AppContainerInversify';
import { ConfigureAction } from '@/2-Commons/2-Application/IoC/Types/ConfigureAction';
import { v4 as uuidV4 } from 'uuid';
import { Inject } from '@/2-Commons/2-Application/IoC/Annotations/Inject';
import '@test/base/Jest/Extensions';
import { ScopeIoC } from '@/2-Commons/2-Application/IoC/Types/ScopeIoC';

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

    test('Should add scoped dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.AddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const result = container.List<UnitTestDependency>(serviceIdentifier);

        const ids = result.map((value) => value.Id);

        // assert
        expect(result.length).toStrictEqual(3);
        expect(ids).toBeDistinctArray();
    });

    test('Should add scoped dynamic dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.AddScopedDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());
        container.AddScopedDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());
        container.AddScopedDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());

        const result = container.List<UnitTestDependency>(serviceIdentifier);

        const ids = result.map((value) => value.Id);

        // assert
        expect(result.length).toStrictEqual(3);
        expect(ids).toBeDistinctArray();
    });

    test('Should try add scoped dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.TryAddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.TryAddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.TryAddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

        const result = container.List<UnitTestDependency>(serviceIdentifier);

        // assert
        expect(result.length).toStrictEqual(1);
        expect(result[0].Id).not.BeNullOrUndefined();
    });

    test('Should try add scoped dynamic dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.TryAddScopedDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());
        container.TryAddScopedDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());
        container.TryAddScopedDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());

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

    test('Should add singleton dynamic dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.AddSingletonDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());
        container.AddSingletonDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());
        container.AddSingletonDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());

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

    test('Should try add singleton dynamic dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.TryAddSingletonDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());
        container.TryAddSingletonDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());
        container.TryAddSingletonDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());

        const result = container.List<UnitTestDependency>(serviceIdentifier);

        // assert

        expect(result.length).toStrictEqual(1);
        expect(result[0].Id).not.BeNullOrUndefined();
    });

    test('Should rebind dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        const mock: jest.Mocked<UnitTestDependency> = {
            Id: '999',
        };

        // act
        container.TryAddSingletonDynamic<UnitTestDependency>(serviceIdentifier, () => new UnitTestDependencyClass());

        container.RebindDynamic<UnitTestDependency>(serviceIdentifier, ScopeIoC.SINGLETON, () => {
            return mock;
        });

        const result = container.Get<UnitTestDependency>(serviceIdentifier);

        // assert
        expect(result.Id).toStrictEqual('999');
    });

    test('Should get scoped dependency', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.TryAddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

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

    test('Should list scoped dependencies', () => {
        // arrange
        const serviceIdentifier = uuidV4();

        // act
        container.AddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);
        container.AddScoped<UnitTestDependency>(serviceIdentifier, UnitTestDependencyClass);

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
        const serviceIdentifierScoped = uuidV4();
        const serviceIdentifierSingleton = uuidV4();

        // act
        container.TryAddScoped<UnitTestDependency>(serviceIdentifierScoped, UnitTestDependencyClass);
        container.TryAddSingleton<UnitTestDependency>(serviceIdentifierSingleton, UnitTestDependencyClass);

        const scope1 = container.CreateScope();
        const scope2 = container.CreateScope();

        const containerDependencyScoped = container.Get<UnitTestDependency>(serviceIdentifierScoped);
        const scope1DependencyScoped = scope1.Get<UnitTestDependency>(serviceIdentifierScoped);
        const scope2DependencyScoped = scope2.Get<UnitTestDependency>(serviceIdentifierScoped);

        const containerDependencySingleton = container.Get<UnitTestDependency>(serviceIdentifierSingleton);
        const scope1DependencySingleton = scope1.Get<UnitTestDependency>(serviceIdentifierSingleton);
        const scope2DependencySingleton = scope2.Get<UnitTestDependency>(serviceIdentifierSingleton);

        // assert
        expect(containerDependencyScoped.Id).not.toStrictEqual(scope1DependencyScoped.Id);
        expect(containerDependencyScoped.Id).not.toStrictEqual(scope2DependencyScoped.Id);
        expect(scope1DependencyScoped.Id).not.toStrictEqual(scope2DependencyScoped.Id);

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
