import {
  ErrorHandler,
  HeartbeatTimeoutError,
  Logger,
  MaxExecutionTimeoutError,
  QueueManager,
  QueueNotRegisteredError,
  QueueRegistration,
  TaskCallback,
  TimeoutWaitingToProcessError,
} from '../../types';
import { StorageProvider } from '../index';
import { randomUUID } from 'node:crypto';

export class QueueManagerImpl implements QueueManager {
  private static _DEFAULT_TTL_QUEUE: number = 7 * 24 * 60 * 60; // Default 7 days
  private static _DEFAULT_POOL_INTERVAL: number = 1_000; // 1 sec
  private readonly _provider: StorageProvider;
  private readonly _logger: Logger;
  private readonly _heartbeatInterval: number;
  private readonly _queueRegistry: Map<string, QueueRegistration>;

  constructor(
    provider: StorageProvider,
    logger: Logger,
    queueRegistrations: QueueRegistration[],
    heartbeatInterval: number = 30000,
  ) {
    this._provider = provider;
    this._logger = logger;
    this._heartbeatInterval = heartbeatInterval;

    this._queueRegistry = new Map();
    for (const registration of queueRegistrations) {
      this._queueRegistry.set(registration.queueName, registration);
    }
    this._logger.info(
      `QueueManager initialized with ${queueRegistrations.length} registered queue(s): ` +
        queueRegistrations
          .map(q => `${q.queueName}(limit:${q.parallelLimit})`)
          .join(', '),
    );

    this.runStartupOrphanCleanup();
  }

  async queueAsync<T>({
    queueName,
    resourceId,
    waitTimeout,
    executionTimeout,
    priority = false,
    taskCallback,
    errorHandler,
  }: {
    queueName: string;
    resourceId: string;
    waitTimeout: number;
    executionTimeout: number;
    priority?: boolean;
    taskCallback: TaskCallback<T>;
    errorHandler?: ErrorHandler<T>;
  }): Promise<T> {
    await this.applyJitter();

    // Step 1: Validate queue registration
    const queueConfig = this._queueRegistry.get(queueName);

    if (!queueConfig) {
      const registeredQueues = Array.from(this._queueRegistry.keys());
      throw new QueueNotRegisteredError(queueName, registeredQueues);
    }

    const processId: string = randomUUID();
    const {
      parallelLimit,
      queueTtlSeconds = QueueManagerImpl._DEFAULT_TTL_QUEUE,
    } = queueConfig;

    this._logger.info(
      `[${processId}] Attempting to queue task in "${queueName}" for resource "${resourceId}" ` +
        `(parallelLimit: ${parallelLimit})`,
    );

    let isInWaitingQueue = false;
    let isInExecution = false;
    let heartbeatTimer: NodeJS.Timeout | null = null;
    const abortController = new AbortController();

    try {
      const executionTtl = Math.ceil(executionTimeout / 1000) + 5;
      const added = await this._provider.addToExecutionAsync(
        queueName,
        resourceId,
        processId,
        parallelLimit,
        executionTtl,
        queueTtlSeconds,
      );

      if (added) {
        // Slot acquired - go directly to execution
        this._logger.info(`[${processId}] Execution slot acquired atomically`);

        isInExecution = true;

        // Execute task
        const result = await this.executeTask(
          queueName,
          resourceId,
          processId,
          executionTimeout,
          taskCallback,
          abortController,
        );

        heartbeatTimer = result.heartbeatTimer;
        return result.result;
      }

      // Step 3: No slot available - add to waiting queue
      this._logger.info(
        `[${processId}] No execution slot available. Adding to waiting queue.`,
      );

      const waitingTtl = Math.ceil(waitTimeout / 1000) + 5;
      await this._provider.addToWaitingQueueAsync(
        queueName,
        resourceId,
        processId,
        waitingTtl,
        queueTtlSeconds,
        priority,
      );
      isInWaitingQueue = true;

      // Step 4: Poll for promotion
      const pollResult = await this.pollForPromotion(
        queueName,
        resourceId,
        processId,
        parallelLimit,
        waitTimeout,
        executionTimeout,
        queueTtlSeconds,
        taskCallback,
        abortController,
      );

      // Successfully promoted and executed
      isInWaitingQueue = false;
      isInExecution = true;
      heartbeatTimer = pollResult.heartbeatTimer;
      return pollResult.result;
    } catch (error) {
      this._logger.error(
        `[${processId}] Error in queue "${queueName}": ${(error as Error).message}`,
        error,
      );

      if (errorHandler) {
        try {
          return await errorHandler(error as Error);
        } catch (handlerError) {
          this._logger.error(
            `[${processId}] Error handler failed: ${(handlerError as Error).message}`,
            handlerError,
          );
          throw handlerError;
        }
      } else {
        throw error;
      }
    } finally {
      // Step 5: Cleanup - ALWAYS execute
      // noinspection PointlessBooleanExpressionJS
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      if (isInWaitingQueue) {
        this._logger.info(`[${processId}] Removing from waiting queue`);
        await this._provider.removeFromWaitingQueueAsync(
          queueName,
          resourceId,
          processId,
        );
      }
      if (isInExecution) {
        this._logger.info(`[${processId}] Removing from execution`);
        await this._provider.removeFromExecutionAsync(
          queueName,
          resourceId,
          processId,
        );
        // Clean up heartbeat key from Redis
        this._logger.info(`[${processId}] Cleaning up heartbeat key`);
        await this._provider.removeHeartbeatAsync(
          queueName,
          resourceId,
          processId,
        );
      }
      this._logger.info(
        `[${processId}] Cleanup completed for queue "${queueName}"`,
      );
    }
  }

  async disconnectAsync(): Promise<void> {
    await this._provider.disconnectAsync();
  }

  private async runStartupOrphanCleanup(): Promise<void> {
    try {
      this._logger.info('Running startup orphan cleanup for all queues...');

      for (const [queueName] of this._queueRegistry) {
        await this._provider.cleanupOrphansAsync(queueName);
      }

      this._logger.info('Startup orphan cleanup completed for all queues');
    } catch (error) {
      this._logger.error('Error during startup orphan cleanup', error);
    }
  }

  private async pollForPromotion<T>(
    queueName: string,
    resourceId: string,
    processId: string,
    parallelLimit: number,
    waitTimeout: number,
    executionTimeout: number,
    queueTtlSeconds: number,
    taskCallback: TaskCallback<T>,
    abortController: AbortController,
  ): Promise<{ result: T; heartbeatTimer: NodeJS.Timeout | null }> {
    const startTime = Date.now();

    while (true) {
      const elapsed = Date.now() - startTime;

      // Check if wait timeout exceeded
      if (elapsed >= waitTimeout) {
        throw new TimeoutWaitingToProcessError(queueName, waitTimeout);
      }

      // Check if we're next in queue and a slot is available
      const position = await this._provider.getWaitingQueuePositionAsync(
        queueName,
        resourceId,
        processId,
      );

      if (position === -1) {
        // Process was removed from queue (shouldn't happen normally)
        throw new Error(`Process ${processId} not found in waiting queue`);
      }

      if (position === 0) {
        // We're next - try to promote atomically
        const executionTtl = Math.ceil(executionTimeout / 1000) + 5;
        const promoted = await this._provider.promoteToExecutionAsync(
          queueName,
          resourceId,
          processId,
          parallelLimit,
          executionTtl,
          queueTtlSeconds,
        );
        if (promoted) {
          this._logger.info(
            `[${processId}] Promoted to execution after ${elapsed}ms`,
          );

          // Execute task
          return await this.executeTask(
            queueName,
            resourceId,
            processId,
            executionTimeout,
            taskCallback,
            abortController,
          );
        }
      }

      // Wait before next poll
      await this.sleep(QueueManagerImpl._DEFAULT_POOL_INTERVAL);
    }
  }

  private async executeTask<T>(
    queueName: string,
    resourceId: string,
    processId: string,
    executionTimeout: number,
    taskCallback: TaskCallback<T>,
    abortController: AbortController,
  ): Promise<{ result: T; heartbeatTimer: NodeJS.Timeout | null }> {
    this._logger.info(`[${processId}] Starting task execution`);
    // Start heartbeat monitoring
    const heartbeatTtl = Math.ceil(this._heartbeatInterval / 1000) * 3; // 3x interval for safety
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let heartbeatFailReject: (reason?: unknown) => void;
    const heartbeatFailPromise = new Promise<never>((_, reject) => {
      heartbeatFailReject = reject;
    });
    heartbeatTimer = setInterval(async () => {
      try {
        await this._provider.updateHeartbeatAsync(
          queueName,
          resourceId,
          processId,
          heartbeatTtl,
        );
        this._logger.info(`[${processId}] Heartbeat updated`);
      } catch (error) {
        this._logger.error(
          `[${processId}] Heartbeat update failed: ${(error as Error).message}`,
          error,
        );
        abortController.abort();
        heartbeatFailReject(new HeartbeatTimeoutError(queueName, processId));
      }
    }, this._heartbeatInterval);

    // Initial heartbeat
    await this._provider.updateHeartbeatAsync(
      queueName,
      resourceId,
      processId,
      heartbeatTtl,
    );

    // Execute with timeout
    const timeoutPromise = this.sleep(executionTimeout).then(() => {
      throw new MaxExecutionTimeoutError(queueName, executionTimeout);
    });

    const taskPromise = taskCallback(abortController.signal, processId);

    const result = await Promise.race([
      taskPromise,
      timeoutPromise,
      heartbeatFailPromise,
    ]);

    this._logger.info(`[${processId}] Task execution completed successfully`);

    return { result: result as T, heartbeatTimer };
  }

  private async applyJitter(min: number = 10, max: number = 50): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return await new Promise(resolve => setTimeout(resolve, delay));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
