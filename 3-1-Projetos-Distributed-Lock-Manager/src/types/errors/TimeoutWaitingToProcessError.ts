import { BaseError } from './base';

export class TimeoutWaitingToProcessError extends BaseError {
  constructor(queueName: string, waitTimeout: number) {
    super(
      `Timeout waiting to process task in queue "${queueName}". ` +
        `Wait timeout of ${waitTimeout}ms expired.`,
    );
  }
}
