import ValKey from 'iovalkey';
import { StorageProvider } from '../../abstractions';
import { Logger, StorageConfigValKeyConnectionDetails } from '../../../types';

export class ValKeyStorageProvider extends StorageProvider {
  private readonly _client: ValKey;
  private readonly _subscriber: ValKey;
  private readonly _logger: Logger;
  private readonly _keyPrefix: string;

  // Lua script for atomic add to execution with capacity check
  private readonly _addToExecutionScript = `
    local executionKey = KEYS[1]
    local trackingKey = KEYS[2]
    local queueTtlSeconds = tonumber(KEYS[3])
    local processId = ARGV[1]
    local parallelLimit = tonumber(ARGV[2])
    local ttl = tonumber(ARGV[3])

    local currentCount = redis.call('SCARD', executionKey)

    if currentCount < parallelLimit then
      redis.call('SADD', executionKey, processId)
      -- Set individual tracking key with TTL for this specific process
      redis.call('SET', trackingKey, 'executing', 'PX', ttl)
      -- Renew queue TTL
      redis.call('EXPIRE', executionKey, queueTtlSeconds)
      return 1
    else
      return 0
    end
  `;

  // Lua script for atomic promotion with capacity check
  private readonly _promoteToExecutionScript = `
    local waitingKey = KEYS[1]
    local executionKey = KEYS[2]
    local waitingTrackingKey = KEYS[3]
    local executionTrackingKey = KEYS[4]
    local queueTtlSeconds = tonumber(KEYS[5])
    local processId = ARGV[1]
    local parallelLimit = tonumber(ARGV[2])
    local executionTtl = tonumber(ARGV[3])

    -- Check if execution count is below limit
    local currentCount = redis.call('SCARD', executionKey)
    if currentCount >= parallelLimit then
      return 0
    end

    -- Check if process is first in waiting queue
    local rank = redis.call('ZRANK', waitingKey, processId)
    if not rank or rank ~= 0 then
      return 0
    end

    -- Atomically remove from waiting and add to execution
    redis.call('ZREM', waitingKey, processId)
    redis.call('DEL', waitingTrackingKey)
    redis.call('SADD', executionKey, processId)
    -- Set individual tracking key with TTL for this specific process
    redis.call('SET', executionTrackingKey, 'executing', 'PX', executionTtl)

    -- Renew queue TTL
    redis.call('EXPIRE', waitingKey, queueTtlSeconds)
    redis.call('EXPIRE', executionKey, queueTtlSeconds)

    return 1
  `;

  public constructor(
    connectionDetails: StorageConfigValKeyConnectionDetails,
    logger: Logger,
    serviceName: string,
  ) {
    super();
    this._logger = logger;
    this._keyPrefix = `estudos-distributed-lock-manager:${serviceName}:`;

    this._client = new ValKey(connectionDetails);

    // Create separate subscriber client for keyspace notifications
    this._subscriber = new ValKey(connectionDetails);

    // Enable keyspace notifications for expired events
    this.setupKeyspaceNotifications();
  }

  /**
   * Clean up orphaned entries from queues on startup.
   * This handles the scenario where all instances crash simultaneously
   * and keyspace notifications are missed.
   *
   * Safe for distributed environments: only removes entries where
   * the tracking key does not exist (orphans).
   */
  public async cleanupOrphansAsync(queueName: string): Promise<void> {
    try {
      this._logger.info(`Starting orphan cleanup for queue: ${queueName}`);

      let cleanedCount = 0;

      // Scan for all resource queues for this queueName
      // Pattern: queue:{queueName}:*:waiting and queue:{queueName}:*:executing
      const waitingPattern = `${this._keyPrefix}queue:${queueName}:*:waiting`;
      const executionPattern = `${this._keyPrefix}queue:${queueName}:*:executing`;

      // Clean waiting queues
      const waitingKeys = await this.scanKeys(waitingPattern);
      for (const waitingKey of waitingKeys) {
        // Extract resourceId from key: queue:{queueName}:{resourceId}:waiting
        // Pattern: queue:{queueName}:{resourceId}:waiting
        const waitingKeyPattern = /^queue:([^:]+):([^:]+):waiting$/;
        const match = waitingKey.match(waitingKeyPattern);

        if (match) {
          const resourceId = match[2]; // Capture group 2 is resourceId

          const waitingMembers = await this._client.zrange(
            waitingKey,
            '0',
            '-1',
          );
          for (const processId of waitingMembers) {
            const trackingKey = this.getProcessTrackingKey(
              queueName,
              resourceId,
              processId,
            );
            const exists = await this._client.exists(trackingKey);

            if (!exists) {
              // Orphan detected - tracking key doesn't exist
              await this._client.zrem(waitingKey, processId);
              cleanedCount++;
              this._logger.info(
                `Removed orphan from waiting queue: ${processId} (resource: ${resourceId})`,
              );
            }
          }
        }
      }

      // Clean execution sets
      const executionKeys = await this.scanKeys(executionPattern);
      for (const executionKey of executionKeys) {
        // Extract resourceId from key: queue:{queueName}:{resourceId}:executing
        // Pattern: queue:{queueName}:{resourceId}:executing
        const executionKeyPattern = /^queue:([^:]+):([^:]+):executing$/;
        const match = executionKey.match(executionKeyPattern);

        if (match) {
          const resourceId = match[2]; // Capture group 2 is resourceId

          const executingMembers = await this._client.smembers(executionKey);
          for (const processId of executingMembers) {
            const trackingKey = this.getProcessTrackingKey(
              queueName,
              resourceId,
              processId,
            );
            const exists = await this._client.exists(trackingKey);

            if (!exists) {
              // Orphan detected - tracking key doesn't exist
              await this._client.srem(executionKey, processId);
              cleanedCount++;
              this._logger.info(
                `Removed orphan from execution set: ${processId} (resource: ${resourceId})`,
              );
            }
          }
        }
      }

      this._logger.info(
        `Orphan cleanup completed for queue: ${queueName}. Cleaned ${cleanedCount} orphan(s)`,
      );
    } catch (error) {
      this._logger.error(
        `Error during orphan cleanup for queue: ${queueName}`,
        error,
      );
    }
  }

  public async addToWaitingQueueAsync(
    queueName: string,
    resourceId: string,
    processId: string,
    ttl: number,
    queueTtlSeconds: number,
    priority: boolean,
  ): Promise<void> {
    const key = this.getWaitingKey(queueName, resourceId);
    const trackingKey = this.getProcessTrackingKey(
      queueName,
      resourceId,
      processId,
    );
    const timestamp = Date.now();

    // Priority-based scoring system:
    // - High priority: score = timestamp (lower score = higher priority)
    // - Normal priority: score = timestamp + 1_000_000_000_000 (~31 years offset)
    // This ensures priority processes always execute first while maintaining FIFO within each level
    const PRIORITY_OFFSET = 1_000_000_000_000;
    const score = priority ? timestamp : timestamp + PRIORITY_OFFSET;

    // Add to sorted set with priority-based score (FIFO ordering within priority level)
    await this._client.zadd(key, score, processId);

    // Set individual tracking key with TTL for this specific process
    // This ensures only THIS process expires, not the entire queue
    await this._client.set(trackingKey, 'waiting', 'PX', ttl * 1000);

    // Renew queue TTL to prevent inactive resource cleanup
    await this._client.expire(key, queueTtlSeconds);
  }

  public async getWaitingQueuePositionAsync(
    queueName: string,
    resourceId: string,
    processId: string,
  ): Promise<number> {
    const key = this.getWaitingKey(queueName, resourceId);
    const rank = await this._client.zrank(key, processId);

    // zrank returns null if not found, we return -1
    return rank !== null ? rank : -1;
  }

  public async removeFromWaitingQueueAsync(
    queueName: string,
    resourceId: string,
    processId: string,
  ): Promise<void> {
    const key = this.getWaitingKey(queueName, resourceId);
    const trackingKey = this.getProcessTrackingKey(
      queueName,
      resourceId,
      processId,
    );

    // Remove from both operational queue and tracking key
    await this._client.zrem(key, processId);
    await this._client.del(trackingKey);
  }

  public async addToExecutionAsync(
    queueName: string,
    resourceId: string,
    processId: string,
    parallelLimit: number,
    ttl: number,
    queueTtlSeconds: number,
  ): Promise<boolean> {
    const key = this.getExecutionKey(queueName, resourceId);
    const trackingKey = this.getProcessTrackingKey(
      queueName,
      resourceId,
      processId,
    );

    const result = await this._client.eval(
      this._addToExecutionScript,
      3, // Number of keys
      key,
      trackingKey,
      queueTtlSeconds.toString(),
      processId,
      parallelLimit.toString(),
      (ttl * 1000).toString(), // Convert to milliseconds for PEXPIRE
    );

    return result === 1;
  }

  public async removeFromExecutionAsync(
    queueName: string,
    resourceId: string,
    processId: string,
  ): Promise<void> {
    const key = this.getExecutionKey(queueName, resourceId);
    const trackingKey = this.getProcessTrackingKey(
      queueName,
      resourceId,
      processId,
    );

    // Remove from both operational set and tracking key
    await this._client.srem(key, processId);
    await this._client.del(trackingKey);
  }

  public async updateHeartbeatAsync(
    queueName: string,
    resourceId: string,
    processId: string,
    ttl: number,
  ): Promise<void> {
    const key = this.getHeartbeatKey(queueName, resourceId, processId);
    const timestamp = Date.now();

    // Store timestamp and set TTL
    await this._client.set(key, timestamp.toString(), 'EX', ttl);
  }

  public async removeHeartbeatAsync(
    queueName: string,
    resourceId: string,
    processId: string,
  ): Promise<void> {
    const key = this.getHeartbeatKey(queueName, resourceId, processId);
    await this._client.del(key);
  }

  public async promoteToExecutionAsync(
    queueName: string,
    resourceId: string,
    processId: string,
    parallelLimit: number,
    executionTtl: number,
    queueTtlSeconds: number,
  ): Promise<boolean> {
    const waitingKey = this.getWaitingKey(queueName, resourceId);
    const executionKey = this.getExecutionKey(queueName, resourceId);
    const waitingTrackingKey = this.getProcessTrackingKey(
      queueName,
      resourceId,
      processId,
    );
    const executionTrackingKey = this.getProcessTrackingKey(
      queueName,
      resourceId,
      processId,
    );

    const result = await this._client.eval(
      this._promoteToExecutionScript,
      5, // Number of keys
      waitingKey,
      executionKey,
      waitingTrackingKey,
      executionTrackingKey,
      queueTtlSeconds.toString(),
      processId,
      parallelLimit.toString(),
      (executionTtl * 1000).toString(), // Convert to milliseconds for PEXPIRE
    );

    return result === 1;
  }

  public async disconnectAsync(): Promise<void> {
    await this._subscriber.quit();
    await this._client.quit();
  }

  private async setupKeyspaceNotifications(): Promise<void> {
    try {
      // Enable keyspace notifications for expired events (Ex)
      await this._client.config('SET', 'notify-keyspace-events', 'Ex');

      // Subscribe to expired events for process tracking keys
      // Pattern: __keyevent@*__:expired
      await this._subscriber.psubscribe('__keyevent@*__:expired');

      this._subscriber.on(
        'pmessage',
        async (_pattern, _channel, expiredKey) => {
          await this.handleExpiredKey(expiredKey);
        },
      );

      this._logger.info('Keyspace notifications enabled for automatic cleanup');
    } catch (error) {
      this._logger.error('Failed to setup keyspace notifications', error);
    }
  }

  private async handleExpiredKey(expiredKey: string): Promise<void> {
    try {
      // Parse key: queue:{queueName}:{resourceId}:process:{processId}:state
      // Pattern: queue:{queueName}:{resourceId}:process:{processId}:state
      const expiredKeyPattern = /^queue:([^:]+):([^:]+):process:([^:]+):state$/;
      const match = expiredKey.match(expiredKeyPattern);

      if (match) {
        const queueName = match[1]; // Capture group 1 is queueName
        const resourceId = match[2]; // Capture group 2 is resourceId
        const processId = match[3]; // Capture group 3 is processId

        this._logger.info(
          `Cleaning up expired process: ${processId} from queue: ${queueName}, resource: ${resourceId}`,
        );

        // Remove from both waiting and executing queues
        // (one will be no-op, the other will clean up the orphan)
        const waitingKey = this.getWaitingKey(queueName, resourceId);
        const executionKey = this.getExecutionKey(queueName, resourceId);

        await this._client.zrem(waitingKey, processId);
        await this._client.srem(executionKey, processId);

        this._logger.info(
          `Cleaned up orphaned entry for process: ${processId}`,
        );
      }
    } catch (error) {
      this._logger.error(`Error handling expired key: ${expiredKey}`, error);
    }
  }

  /**
   * Scan Redis keys matching a pattern
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const result = await this._client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        '100',
      );
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    return keys;
  }

  private getWaitingKey(queueName: string, resourceId: string): string {
    return `${this._keyPrefix}queue:${queueName}:${resourceId}:waiting`;
  }

  private getExecutionKey(queueName: string, resourceId: string): string {
    return `${this._keyPrefix}queue:${queueName}:${resourceId}:executing`;
  }

  private getHeartbeatKey(
    queueName: string,
    resourceId: string,
    processId: string,
  ): string {
    return `${this._keyPrefix}queue:${queueName}:${resourceId}:heartbeat:${processId}`;
  }

  private getProcessTrackingKey(
    queueName: string,
    resourceId: string,
    processId: string,
  ): string {
    return `${this._keyPrefix}queue:${queueName}:${resourceId}:process:${processId}:state`;
  }
}
