export abstract class StorageProvider {
  abstract addToWaitingQueueAsync(
    queueName: string,
    resourceId: string,
    processId: string,
    ttl: number,
    queueTtlSeconds: number,
    priority: boolean,
  ): Promise<void>;

  abstract getWaitingQueuePositionAsync(
    queueName: string,
    resourceId: string,
    processId: string,
  ): Promise<number>;

  abstract removeFromWaitingQueueAsync(
    queueName: string,
    resourceId: string,
    processId: string,
  ): Promise<void>;

  abstract addToExecutionAsync(
    queueName: string,
    resourceId: string,
    processId: string,
    parallelLimit: number,
    ttl: number,
    queueTtlSeconds: number,
  ): Promise<boolean>;

  abstract removeFromExecutionAsync(
    queueName: string,
    resourceId: string,
    processId: string,
  ): Promise<void>;

  abstract updateHeartbeatAsync(
    queueName: string,
    resourceId: string,
    processId: string,
    ttl: number,
  ): Promise<void>;

  abstract removeHeartbeatAsync(
    queueName: string,
    resourceId: string,
    processId: string,
  ): Promise<void>;

  abstract promoteToExecutionAsync(
    queueName: string,
    resourceId: string,
    processId: string,
    parallelLimit: number,
    executionTtl: number,
    queueTtlSeconds: number,
  ): Promise<boolean>;

  abstract cleanupOrphansAsync(queueName: string): Promise<void>;

  abstract disconnectAsync(): Promise<void>;
}
