import type { Config } from 'jest';
import { GlobalConfig } from '../../jest.global.config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const config: Config = {
    ...GlobalConfig,
    testMatch: ['<rootDir>/test/unit/**/*.[jt]s?(x)', '!**/test/**/jest.config.ts'],
    displayName: {
        name: 'unit-test',
        color: 'magenta',
    },
};

export default config;
