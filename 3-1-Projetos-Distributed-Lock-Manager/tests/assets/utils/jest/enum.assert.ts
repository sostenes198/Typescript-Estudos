export class EnumAssert {
  public static assert(
    enumToValidate: object,
    enumKeysExpected: Array<string>,
    enumValuesExpected: Array<string>,
  ) {
    const keys = Object.keys(enumToValidate).map(item => item.toString());
    const values = Object.values(enumToValidate).map(item => item.toString());
    expect(keys).toStrictEqual(enumKeysExpected);
    expect(values).toStrictEqual(enumValuesExpected);
  }

  public static assertNumberEnum(
    enumToValidate: object,
    enumKeysExpected: string[],
    enumValuesExpected: number[],
  ): void {
    const keys = Object.keys(enumToValidate).filter((key): boolean =>
      Number.isNaN(Number(key)),
    );
    const values = Object.values(enumToValidate).filter(
      (key): boolean => !Number.isNaN(Number(key)),
    );
    expect(keys).toStrictEqual(enumKeysExpected);
    expect(values).toStrictEqual(enumValuesExpected);
  }
}
