import { Logger } from '../../../src/types';
import { testUtil } from '../../assets';

export class LoggerMock implements Logger {
  info = testUtil.jest.jestFnMockImplementationDefault();
  error = testUtil.jest.jestFnMockImplementationDefault();
}
