import { BaseError } from './base';

export class MaxExecutionTimeoutError extends BaseError {
  constructor(queueName: string, executionTimeout: number) {
    super(
      `Maximum execution timeout reached for queue "${queueName}". ` +
        `Execution timeout of ${executionTimeout}ms expired.`,
    );
  }
}
