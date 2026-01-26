export interface QueueRegistration {
  queueName: string;
  parallelLimit: number;
  queueTtlSeconds?: number;
}
