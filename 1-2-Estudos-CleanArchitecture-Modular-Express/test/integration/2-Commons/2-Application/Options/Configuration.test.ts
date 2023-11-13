import BaseTest from '@test/integration/BaseTest';
import { Configuration } from '@/2-Commons/2-Application/Options/Configuration';
import IocTypes from '@/2-Commons/2-Application/IoC/IoCTypes';
import { ConfigurationFixture } from '@test/integration/2-Commons/2-Application/Options/Fixtures/Configuration.Fixture';

type CustomObj2 = {
    Prop1: string;
    Prop2: boolean;
    Prop3: number;
    Prop4: number[];
    Prop5: string[];
    Prop6: {
        Prop1: string;
        Prop2: boolean;
        Prop3: number;
        Prop4: number[];
        Prop5: string[];
    };
};

describe('Configuration', () => {
    beforeEach(async () => {
        await BaseTest.Start(`${__dirname}/provider-configuration-test.json`);
    });

    test('Should validate configuration', () => {
        // arrange
        const config = BaseTest.ServiceProvider.Get<Configuration>(IocTypes.Configuration.Value);

        // act
        const prop1 = config.Get<string>('Prop1');
        const prop2 = config.Get<boolean>('Prop2');
        const prop3 = config.Get<number>('Prop3');
        const prop4 = config.Get<number[]>('Prop4');
        const prop5 = config.Get<string[]>('Prop5');
        const obj1 = config.Get<object>('Obj1');
        const obj1Prop1 = config.Get<string>('Obj1:Prop1');
        const obj1Prop2 = config.Get<boolean>('Obj1:Prop2');
        const obj1Prop3 = config.Get<number>('Obj1:Prop3');
        const obj1Prop4 = config.Get<number[]>('Obj1:Prop4');
        const obj1Prop5 = config.Get<string[]>('Obj1:Prop5');
        const obj2 = config.Get<CustomObj2>('Obj2');

        // assert
        expect(prop1).toStrictEqual('Prop1');
        expect(prop2).toStrictEqual(true);
        expect(prop3).toStrictEqual(123);
        expect(prop4).toStrictEqual([1, 2, 3]);
        expect(prop5).toStrictEqual(['a', 'b', 'c']);
        expect(obj1).toStrictEqual({
            Prop1: 'Prop1',
            Prop2: true,
            Prop3: 123,
            Prop4: [1, 2, 3],
            Prop5: ['a', 'b', 'c'],
        });
        expect(obj1Prop1).toStrictEqual('Prop1');
        expect(obj1Prop2).toStrictEqual(true);
        expect(obj1Prop3).toStrictEqual(123);
        expect(obj1Prop4).toStrictEqual([1, 2, 3]);
        expect(obj1Prop5).toStrictEqual(['a', 'b', 'c']);
        expect(obj2).toStrictEqual(ConfigurationFixture.GetObj2FromJsonConfig());
    });
});
