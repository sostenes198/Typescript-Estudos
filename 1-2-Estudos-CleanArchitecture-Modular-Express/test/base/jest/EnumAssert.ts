export class EnumAssert {
    private constructor() {}

    public static Assert(enumToValidate: object, enumKeysExpected: Array<string>, enumValuesExpected: Array<string>) {
        const keys = Object.keys(enumToValidate);
        const values = Object.values(enumToValidate);
        expect(keys).toStrictEqual(enumKeysExpected);
        expect(values).toStrictEqual(enumValuesExpected);
    }
}
