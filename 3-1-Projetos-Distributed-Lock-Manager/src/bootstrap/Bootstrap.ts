import { QueueManagerImpl } from '../internal/managers';
import { Logger, QueueManagerConfig, StorageConfig } from '../types';
import { StorageProviderFactory } from '../internal';

let queueManager: QueueManagerImpl = null!;

class Bootstrap {
  public static initialize({
    serviceName,
    storageConfig,
    queueManagerConfig,
    logger,
    heartbeatInterval,
  }: {
    serviceName: string;
    storageConfig: StorageConfig;
    queueManagerConfig: QueueManagerConfig;
    logger: Logger;
    heartbeatInterval?: number;
  }): Promise<void> {
    const internalHeartbeatInterval = heartbeatInterval ?? 30000;

    const provider = StorageProviderFactory.create(
      storageConfig,
      logger,
      serviceName,
    );

    queueManager = new QueueManagerImpl(
      provider,
      logger,
      queueManagerConfig.queueRegistration,
      internalHeartbeatInterval,
    );

    return Promise.resolve();
  }

  public static closeAsync(): Promise<void> {
    return queueManager.disconnectAsync();
  }
}

const cleanQueueManager = () => {
  queueManager = null!;
};

export { Bootstrap, queueManager, cleanQueueManager };
