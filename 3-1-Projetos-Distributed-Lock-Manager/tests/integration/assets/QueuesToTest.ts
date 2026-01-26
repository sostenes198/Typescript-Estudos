import { QueueRegistration } from '../../../src/types';

export class QueuesToTest {
  public static readonly queue: QueueRegistration = {
    queueName: 'integration-test-quest',
    parallelLimit: 3,
  };
}
