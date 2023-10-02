import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';
import type { Config } from 'jest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

export const GlobalConfig: Config = {
    rootDir: `${__dirname}`,
    moduleFileExtensions: ['js', 'json', 'ts'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>',
    }),
    testPathIgnorePatterns: ['/node_modules/', '/coverage/'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
    collectCoverageFrom: ['<rootDir>/src/**/*.(t|j)s', '!**/Startup.ts'],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['html'],
    preset: 'ts-jest',
    testEnvironment: 'node',
} as Config;
