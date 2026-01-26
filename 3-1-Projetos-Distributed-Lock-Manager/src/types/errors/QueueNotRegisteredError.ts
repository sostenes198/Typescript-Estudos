import { BaseError } from './base';

export class QueueNotRegisteredError extends BaseError {
  constructor(queueName: string, registeredQueues: string[]) {
    const availableQueues =
      registeredQueues.length > 0 ? registeredQueues.join(', ') : 'none';
    super(
      `Queue "${queueName}" is not registered. ` +
        `Queues must be registered during bootstrap before they can be used. ` +
        `Available queues: ${availableQueues}`,
    );
  }
}
