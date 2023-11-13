export class ConfigurationFixture {
    public static GetObj2FromJsonConfig() {
        return {
            Prop1: 'Prop1',
            Prop2: true,
            Prop3: 123,
            Prop4: [1, 2, 3],
            Prop5: ['a', 'b', 'c'],
            Prop6: {
                Prop1: 'Prop1',
                Prop2: true,
                Prop3: 123,
                Prop4: [1, 2, 3],
                Prop5: ['a', 'b', 'c'],
            },
        };
    }
}
