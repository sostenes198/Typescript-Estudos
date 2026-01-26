import { TaskCallback } from './TaskCallback';
import { ErrorHandler } from './ErrorHandler';

export interface QueueManager {
  queueAsync<T>(params: {
    queueName: string;
    resourceId: string;
    waitTimeout: number;
    executionTimeout: number;
    priority?: boolean;
    taskCallback: TaskCallback<T>;
    errorHandler?: ErrorHandler<T>;
  }): Promise<T>;

  disconnectAsync(): Promise<void>;
}
