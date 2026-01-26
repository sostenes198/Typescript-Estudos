/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-namespace */
import CustomMatcherResult = jest.CustomMatcherResult;
import { AssertPropertiesObj, AssertPropertiesTypes } from './types';

declare global {
  namespace jest {
    interface Matchers<R> {
      beNullOrUndefined(): R;
      assertProperties(assertProperties: Array<AssertPropertiesObj>): R;
      customAssert(
        assertFunc: (expectResult: jest.Mock) => CustomMatcherResult,
      ): R;
    }

    interface Expect {
      customAssertParam(
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
        Object.getOwnPropertyDescriptor(received, element.propertyName)!;
      const type: AssertPropertiesTypes = typeof describe.value;
      _matchType(type, element);
    });

    return {
      message: () => `expected ${received} contains all properties`,
      pass: true,
    };
  },
  customAssert(
    expectResult: jest.Mock,
    assertFunc: (expectResult: jest.Mock) => CustomMatcherResult,
  ): jest.CustomMatcherResult {
    if (!jest.isMockFunction(expectResult)) {
      return {
        message: () => 'parameter expect must bem a jest.Mock',
        pass: false,
      };
    }

    return assertFunc(expectResult);
  },
  customAssertParam(
    result: any,
    assertFunc: (result: any) => CustomMatcherResult,
  ): CustomMatcherResult {
    return assertFunc(result);
  },
});
