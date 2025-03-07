import type { Config } from 'jest'
import { GlobalConfig } from '../jest.global.config'

const config: Config = {
  ...GlobalConfig,
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts']
} as Config

export default config