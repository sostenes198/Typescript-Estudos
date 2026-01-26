import { StorageProvider } from '../../../src/internal';
import { testUtil } from '../../assets';

export class StorageProviderMock implements StorageProvider {
  addToWaitingQueueAsync = testUtil.jest.jestFnMockImplementationDefault();
  getWaitingQueuePositionAsync =
    testUtil.jest.jestFnMockImplementationDefault();
  removeFromWaitingQueueAsync = testUtil.jest.jestFnMockImplementationDefault();
  getNextInQueueAsync = testUtil.jest.jestFnMockImplementationDefault();
  addToExecutionAsync = testUtil.jest.jestFnMockImplementationDefault();
  getExecutionCountAsync = testUtil.jest.jestFnMockImplementationDefault();
  removeFromExecutionAsync = testUtil.jest.jestFnMockImplementationDefault();
  updateHeartbeatAsync = testUtil.jest.jestFnMockImplementationDefault();
  getHeartbeatAsync = testUtil.jest.jestFnMockImplementationDefault();
  removeHeartbeatAsync = testUtil.jest.jestFnMockImplementationDefault();
  promoteToExecutionAsync = testUtil.jest.jestFnMockImplementationDefault();
  cleanupOrphansAsync = testUtil.jest.jestFnMockImplementationDefault();
  disconnectAsync = testUtil.jest.jestFnMockImplementationDefault();
}
