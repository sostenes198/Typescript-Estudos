import { Config } from 'jest';
import { resolve } from 'path';

const root: string = resolve(__dirname, '..');

const _isCommandLine: boolean = !!process.env.EXECUTE_FROM_CMD;
const FileExtension: string = _isCommandLine ? 'js' : 'ts';

const GlobalConfig: Config = {
  rootDir: root,
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  collectCoverage: false,
  coverageDirectory: '../coverage',
  collectCoverageFrom: [`<rootDir>/src/**/*.${FileExtension}`],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [`index\\.${FileExtension}`],
  testPathIgnorePatterns: ['/node_modules/'],
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  setupFilesAfterEnv: [
    `<rootDir>/tests/jest.setup.environment.${FileExtension}`,
  ],
  verbose: false,
  testTimeout: 1000 * 60,
  forceExit: true,
  bail: process.env['IS_PIPELINE_RUNNING'] ? 1 : 0,
};

if (!_isCommandLine) {
  GlobalConfig.preset = 'ts-jest';
  GlobalConfig.transform = {
    '^.+\\.(t|j)s$': 'ts-jest',
  };
}

export { GlobalConfig, FileExtension };
