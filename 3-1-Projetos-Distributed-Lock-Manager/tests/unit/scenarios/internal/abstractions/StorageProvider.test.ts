import { StorageProvider } from '../../../../../src/internal';

class TestStorageProvider extends StorageProvider {
  addToWaitingQueueAsync = jest.fn();
  getWaitingQueuePositionAsync = jest.fn();
  removeFromWaitingQueueAsync = jest.fn();
  addToExecutionAsync = jest.fn();
  removeFromExecutionAsync = jest.fn();
  updateHeartbeatAsync = jest.fn();
  removeHeartbeatAsync = jest.fn();
  promoteToExecutionAsync = jest.fn();
  cleanupOrphansAsync = jest.fn();
  disconnectAsync = jest.fn();
}

describe('StorageProvider', () => {
  let provider: TestStorageProvider;

  beforeEach(() => {
    provider = new TestStorageProvider();
  });

  it('should be able to be extended and instantiated', () => {
    expect(provider).toBeInstanceOf(StorageProvider);
  });

  it('should allow calling abstract methods when implemented', async () => {
    const queueName = 'test-queue';
    const resourceId = 'resource-1';
    const processId = 'process-1';
    const ttl = 1000;
    const queueTtlSeconds = 3600;
    const priority = false;
    const parallelLimit = 5;
    const executionTtl = 5000;

    await provider.addToWaitingQueueAsync(
      queueName,
      resourceId,
      processId,
      ttl,
      queueTtlSeconds,
      priority,
    );

    expect(provider.addToWaitingQueueAsync).toHaveBeenCalledWith(
      queueName,
      resourceId,
      processId,
      ttl,
      queueTtlSeconds,
      priority,
    );

    provider.getWaitingQueuePositionAsync.mockResolvedValue(1);
    await expect(
      provider.getWaitingQueuePositionAsync(queueName, resourceId, processId),
    ).resolves.toBe(1);

    await provider.removeFromWaitingQueueAsync(
      queueName,
      resourceId,
      processId,
    );
    expect(provider.removeFromWaitingQueueAsync).toHaveBeenCalledWith(
      queueName,
      resourceId,
      processId,
    );

    provider.addToExecutionAsync.mockResolvedValue(true);
    await expect(
      provider.addToExecutionAsync(
        queueName,
        resourceId,
        processId,
        parallelLimit,
        ttl,
        queueTtlSeconds,
      ),
    ).resolves.toBe(true);

    await provider.removeFromExecutionAsync(queueName, resourceId, processId);
    expect(provider.removeFromExecutionAsync).toHaveBeenCalledWith(
      queueName,
      resourceId,
      processId,
    );

    await provider.updateHeartbeatAsync(queueName, resourceId, processId, ttl);
    expect(provider.updateHeartbeatAsync).toHaveBeenCalledWith(
      queueName,
      resourceId,
      processId,
      ttl,
    );

    await provider.removeHeartbeatAsync(queueName, resourceId, processId);
    expect(provider.removeHeartbeatAsync).toHaveBeenCalledWith(
      queueName,
      resourceId,
      processId,
    );

    provider.promoteToExecutionAsync.mockResolvedValue(true);
    await expect(
      provider.promoteToExecutionAsync(
        queueName,
        resourceId,
        processId,
        parallelLimit,
        executionTtl,
        queueTtlSeconds,
      ),
    ).resolves.toBe(true);

    await provider.cleanupOrphansAsync(queueName);
    expect(provider.cleanupOrphansAsync).toHaveBeenCalledWith(queueName);

    await provider.disconnectAsync();
    expect(provider.disconnectAsync).toHaveBeenCalled();
  });
});
