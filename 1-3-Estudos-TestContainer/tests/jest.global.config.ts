/* eslint-disable */
// noinspection DuplicatedCode

// import { pathsToModuleNameMapper } from 'ts-jest';
// import { compilerOptions } from './tsconfig.json';
import type { Config } from 'jest';

const root: string = `${__dirname}/../`;

const GlobalConfig: Config = {
    rootDir: root,
    clearMocks: true,
    restoreMocks: true,
    preset: 'ts-jest',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    // moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    //     prefix: '<rootDir>',
    // }),
    moduleFileExtensions: ['js', 'json', 'ts'],
    testEnvironment: 'node',
    collectCoverage: false,
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    coveragePathIgnorePatterns: ['index\\.ts'],
    testPathIgnorePatterns: ['/node_modules/'],
    roots: ['<rootDir>/src/', '<rootDir>/tests/'],
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.environment.ts'],
    verbose: true,
    testTimeout: 1000 * 60,
    workerIdleMemoryLimit: '250mb',
};

export default GlobalConfig;
