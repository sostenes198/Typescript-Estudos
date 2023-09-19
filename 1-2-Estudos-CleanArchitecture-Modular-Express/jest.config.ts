import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';
// import type { Config } from 'jest';

export default {
    moduleFileExtensions: ['js', 'json', 'ts'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>/',
    }),
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '<rootDir>/test/**/*.[jt]s?(x)'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
    collectCoverageFrom: ['./src/**/*.(t|j)s'],
    coverageDirectory: './coverage',
    coverageReporters: ['html'],
    preset: 'ts-jest',
    testEnvironment: 'node',
};
