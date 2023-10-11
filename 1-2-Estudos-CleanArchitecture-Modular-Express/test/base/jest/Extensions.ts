/* eslint-disable @typescript-eslint/no-namespace,@typescript-eslint/no-unused-vars */
import CustomMatcherResult = jest.CustomMatcherResult;

declare namespace jest {
    interface Matchers<R> {
        BeNullOrUndefined(): R;
        toBeDistinctArray(): R;
        toBeEqualsArrays(received: Array<any>): R;
    }
}

expect.extend({
    BeNullOrUndefined(received: any): CustomMatcherResult {
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
    toBeDistinctArray(received): CustomMatcherResult {
        const pass = Array.isArray(received) && new Set(received).size === received.length;
        if (pass) {
            return {
                message: () => `expected [${received}] array is unique`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected [${received}] array is not to unique`,
                pass: false,
            };
        }
    },
    toBeEqualsArrays(actual: Array<any>, received: Array<any>): CustomMatcherResult {
        const pass: boolean = Array.isArray(actual) && Array.isArray(received) && actual.length === received.length && actual.every((val, index) => val === received[index]);
        if (pass) {
            return {
                message: () => `expected [${actual}] array equals array [${received}]`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected [${actual}] array not equals array [${received}]`,
                pass: false,
            };
        }
    },
});
