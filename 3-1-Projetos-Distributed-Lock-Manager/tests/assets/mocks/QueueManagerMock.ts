import { testUtil } from '../../assets';
import { QueueManager } from '../../../src/types';

export class QueueManagerMock implements QueueManager {
  queueAsync = testUtil.jest.jestFnMockImplementationDefault();
  disconnectAsync = testUtil.jest.jestFnMockImplementationDefault();
}
