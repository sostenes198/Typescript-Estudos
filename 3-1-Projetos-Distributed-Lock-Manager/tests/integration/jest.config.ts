import type { Config } from 'jest';
import { FileExtension, GlobalConfig } from '../jest.global.config';

const config: Config = {
  ...GlobalConfig,
  setupFilesAfterEnv: [
    ...GlobalConfig.setupFilesAfterEnv!,
    `<rootDir>/tests/integration/jest.setup.config.${FileExtension}`,
  ],
  globalSetup: `<rootDir>/tests/integration/jest.global.up.${FileExtension}`,
  globalTeardown: `<rootDir>/tests/integration/jest.global.down.${FileExtension}`,
  displayName: {
    name: 'integration-test',
    color: 'yellowBright',
  },
  testMatch: [
    `<rootDir>/tests/integration/scenarios/**/*.test.${FileExtension}`,
  ],
  maxWorkers: 1,
  bail: true,
};

export default config;
