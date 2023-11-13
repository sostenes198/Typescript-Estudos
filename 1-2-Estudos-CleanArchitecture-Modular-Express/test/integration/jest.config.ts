import type { Config } from 'jest';
import { GlobalConfig } from '../../jest.global.config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const config: Config = {
    ...GlobalConfig,
    displayName: {
        name: 'integration-test',
        color: 'green',
    },
    setupFilesAfterEnv: [...GlobalConfig.setupFilesAfterEnv!, '<rootDir>/test/integration/jest.setup.ts'],
    testMatch: ['**/test/integration/**/*.test.ts'],
};

export default config;
