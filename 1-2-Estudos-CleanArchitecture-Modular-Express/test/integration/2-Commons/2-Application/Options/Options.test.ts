import BaseTest from '@test/integration/BaseTest';
import { DependencyInjectionExtensions } from '@/2-Commons/1-Infrastructure/Options/Extensions/DependencyInjectionExtensions';
import { OptionsImp } from '@/2-Commons/1-Infrastructure/Options/OptionsImp';
import { Options } from '@/2-Commons/2-Application/Options/Options';
import { ConfigurationFixture } from '@test/integration/2-Commons/2-Application/Options/Fixtures/Configuration.Fixture';
import { ServiceIdentifier } from '@/2-Commons/2-Application/IoC/Types/ServiceIdentifier';

const serviceIdentifier: ServiceIdentifier = 'TestOptions';

class UnitTestOptions {
    public readonly Prop1?: string;
    public readonly Prop2?: boolean;
    public readonly Prop3?: number;
    public readonly Prop4?: number[];
    public readonly Prop5?: string[];
    public readonly Prop6?: UnitTestProp6Options;
}

class UnitTestProp6Options {
    public readonly Prop1?: string;
    public readonly Prop2?: boolean;
    public readonly Prop3?: number;
    public readonly Prop4?: number[];
    public readonly Prop5?: string[];
}

describe('Configuration', () => {
    beforeEach(async () => {
        await BaseTest.Start(`${__dirname}/provider-configuration-test.json`);
        DependencyInjectionExtensions.AddOptions(BaseTest.ServiceProvider, serviceIdentifier, 'Obj2');
    });

    test('Should validate Options', () => {
        // arrange
        const expectedResult = new OptionsImp<UnitTestOptions>(ConfigurationFixture.GetObj2FromJsonConfig());
        // act
        const opt = BaseTest.ServiceProvider.Get<Options<UnitTestOptions>>(serviceIdentifier);
        const opt1 = BaseTest.ServiceProvider.Get<Options<UnitTestOptions>>(serviceIdentifier);

        const scope = BaseTest.ServiceProvider.CreateScope();
        const optScoped = scope.Get<Options<UnitTestOptions>>(serviceIdentifier);
        const optScoped1 = scope.Get<Options<UnitTestOptions>>(serviceIdentifier);

        // assert
        expect(opt).toStrictEqual(expectedResult);
        expect(opt === opt1).toBeTruthy();
        expect(opt === optScoped).toBeTruthy();
        expect(opt === optScoped1).toBeTruthy();
        expect(optScoped === optScoped1).toBeTruthy();
    });
});
