import { BaseError } from './base';

export class HeartbeatTimeoutError extends BaseError {
  constructor(queueName: string, processId: string) {
    super(
      `Heartbeat timeout for process "${processId}" in queue "${queueName}". ` +
        `The heartbeat update failed or the event loop is blocked.`,
    );
  }
}
