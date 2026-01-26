import '../../../assets';
import {
  ErrorHandler,
  QueueManager,
  TaskCallback,
} from '../../../../src/types';

describe('QueueManager', () => {
  const _assertQueueManager = function (
    QueueManager: QueueManager,
    queueAsync: <T>(params: {
      queueName: string;
      resourceId: string;
      waitTimeout: number;
      executionTimeout: number;
      priority?: boolean;
      taskCallback: TaskCallback<T>;
      errorHandler?: ErrorHandler<T>;
    }) => Promise<T>,
    disconnectAsync: () => Promise<void>,
  ): void {
    expect(QueueManager).toStrictEqual({
      queueAsync,
      disconnectAsync,
    });
  };

  const _assertPropertiesQueueManager = function (
    QueueManager: QueueManager,
  ): void {
    expect(QueueManager).assertProperties([
      { propertyName: 'queueAsync', typeProperty: 'function' },
      { propertyName: 'disconnectAsync', typeProperty: 'function' },
    ]);
  };

  it('Should validate type QueueManager', () => {
    // arrange - act
    const QueueManager: QueueManager = {
      queueAsync<T>(_: {}): Promise<T> {
        return null!;
      },
      disconnectAsync(): Promise<void> {
        return null!;
      },
    };

    // assert
    _assertQueueManager(
      QueueManager,
      QueueManager.queueAsync,
      QueueManager.disconnectAsync,
    );
    _assertPropertiesQueueManager(QueueManager);
  });
});
