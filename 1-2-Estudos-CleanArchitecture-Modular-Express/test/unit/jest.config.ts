import type { Config } from 'jest';
import { GlobalConfig } from '../../jest.global.config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const config: Config = {
    ...GlobalConfig,
    displayName: {
        name: 'unit-test',
        color: 'magenta',
    },
    setupFilesAfterEnv: [...GlobalConfig.setupFilesAfterEnv!],
};

export default config;
