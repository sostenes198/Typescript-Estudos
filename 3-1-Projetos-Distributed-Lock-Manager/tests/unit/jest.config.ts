/* eslint-disable */
import { FileExtension, GlobalConfig } from '../jest.global.config';
import type { Config } from 'jest';

const config: Config = {
    ...GlobalConfig,
    collectCoverage: true,
    setupFilesAfterEnv: [
        ...GlobalConfig.setupFilesAfterEnv!,
    ],
    displayName: {
        name: 'unit-test',
        color: 'green',
    },
    testMatch: [`<rootDir>/tests/unit/scenarios/**/*.test.${FileExtension}`],
    bail: process.env['IS_PIPELINE_RUNNING'] ? 1 : 0,
};

export default config;
