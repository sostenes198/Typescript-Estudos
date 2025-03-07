import { Config } from 'jest';
import { GlobalConfigCi } from '../jest.global.config.ci';

const config: Config = {
    ...GlobalConfigCi,
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage',
    collectCoverageFrom: ['<rootDir>/src/**/*.js'],
    testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
};

export default config;
