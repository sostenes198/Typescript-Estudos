/* eslint-disable @typescript-eslint/no-namespace,@typescript-eslint/no-unused-vars,no-use-before-define,@typescript-eslint/no-explicit-any */
import CustomMatcherResult = jest.CustomMatcherResult;
import { AssertPropertiesObj, AssertPropertiesTypes } from './types';

declare global {
  namespace jest {
    interface Matchers<R> {
      beNullOrUndefined(): R;

      assertProperties(assertProperties: Array<AssertPropertiesObj>): R;
    }

    interface Expect {
      customAssert(
        assertFunc: (result: any) => CustomMatcherResult,
      ): CustomMatcherResult;
    }
  }
}

const _matchType = (
  type: AssertPropertiesTypes,
  expectedObj: AssertPropertiesObj,
): void => {
  try {
    expect(type).toStrictEqual(expectedObj.typeProperty);
  } catch (e) {
    const parsedError: Error = e as Error;
    throw new Error(
      `${parsedError.message}\nProperty: ${expectedObj.propertyName}`,
    );
  }
};

expect.extend({
  beNullOrUndefined(received: any): CustomMatcherResult {
    if (!received) {
      return {
        message: () => `expected ${received} to be null or undefined`,
        pass: true,
      };
    }

    return {
      message: () => `expected ${received} to be null or undefined`,
      pass: false,
    };
  },
  assertProperties(
    received: object,
    assertProperties: Array<AssertPropertiesObj>,
  ): CustomMatcherResult {
    const expectedProperties: string[] = Object.keys(received).sort();
    const properties: string[] = assertProperties
      .map((value: AssertPropertiesObj) => value.propertyName)
      .sort();

    expect(expectedProperties.length).toStrictEqual(properties.length);
    expect(expectedProperties).toStrictEqual(properties);

    assertProperties.forEach((element: AssertPropertiesObj) => {
      const describe: PropertyDescriptor | undefined =
        Object.getOwnPropertyDescriptor(
          received,
          element.propertyName,
        )!;
      const type: AssertPropertiesTypes = typeof describe.value;
      _matchType(type, element);
    });

    return {
      message: () => `expected ${received} contains all properties`,
      pass: true,
    };
  },
  customAssert(
    result: any,
    assertFunc: (result: any) => CustomMatcherResult,
  ): CustomMatcherResult {
    return assertFunc(result);
  },
});
