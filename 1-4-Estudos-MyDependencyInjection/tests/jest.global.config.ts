import type { Config } from 'jest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

const root = `${__dirname}/../`;

const GlobalConfig: Config = {
  rootDir: root,
  displayName: {
    name: 'unit-tests',
    color: 'blue'
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testPathIgnorePatterns: ['/node_modules/', '/coverage/'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: []
} as Config;

export { GlobalConfig };
