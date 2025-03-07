import type { Config } from 'jest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

const GlobalConfigCi: Config = {
  rootDir: `${__dirname}`,
  moduleFileExtensions: ['js', 'json', 'ts'],
  testPathIgnorePatterns: ['/node_modules/', '/coverage/'],
  displayName: {
    name: 'unit-tests',
    color: 'blue'
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: []
} as Config;

export { GlobalConfigCi };
