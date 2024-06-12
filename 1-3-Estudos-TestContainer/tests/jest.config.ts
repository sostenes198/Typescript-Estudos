/* eslint-disable */
import GlobalConfig from './jest.global.config';
import type { Config } from 'jest';

const config: Config = {
    ...GlobalConfig,
    setupFilesAfterEnv: [
        ...GlobalConfig.setupFilesAfterEnv!,
        '<rootDir>/tests/jest.setup.config.ts',
    ],
    globalSetup: '<rootDir>/tests/jest.global.up.ts',
    globalTeardown: '<rootDir>/tests/jest.global.down.ts',
    displayName: {
        name: 'integration-test',
        color: 'yellowBright',
    },
    testMatch: ['<rootDir>/tests/tests/**/*.test.ts'],
    maxWorkers: 1,
};
export default config;
