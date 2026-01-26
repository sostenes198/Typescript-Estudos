import '../../../assets';
import { QueueRegistration } from '../../../../src/types';

describe('QueueRegistration', () => {
  const _assertQueueRegistration = function (
    QueueRegistration: QueueRegistration,
    queueName: string,
    parallelLimit: number,
    queueTtlSeconds: number,
  ): void {
    expect(QueueRegistration).toStrictEqual({
      queueName,
      parallelLimit,
      queueTtlSeconds,
    });
  };

  const _assertPropertiesQueueRegistration = function (
    QueueRegistration: QueueRegistration,
  ): void {
    expect(QueueRegistration).assertProperties([
      { propertyName: 'queueName', typeProperty: 'string' },
      { propertyName: 'parallelLimit', typeProperty: 'number' },
      { propertyName: 'queueTtlSeconds', typeProperty: 'number' },
    ]);
  };

  it('Should validate type QueueRegistration', () => {
    // arrange - act
    const QueueRegistration: QueueRegistration = {
      queueName: 'queue',
      parallelLimit: 1,
      queueTtlSeconds: 30,
    };

    // assert
    _assertQueueRegistration(
      QueueRegistration,
      QueueRegistration.queueName,
      QueueRegistration.parallelLimit,
      QueueRegistration.queueTtlSeconds!,
    );
    _assertPropertiesQueueRegistration(QueueRegistration);
  });
});
