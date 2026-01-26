import '../../../assets';
import { QueueManagerConfig, QueueRegistration } from '../../../../src/types';

describe('QueueManagerConfig', () => {
  const _assertQueueManagerConfig = function (
    QueueManagerConfig: QueueManagerConfig,
    queueRegistration: QueueRegistration[],
  ): void {
    expect(QueueManagerConfig).toStrictEqual({
      queueRegistration,
    });
  };

  const _assertPropertiesQueueManagerConfig = function (
    QueueManagerConfig: QueueManagerConfig,
  ): void {
    expect(QueueManagerConfig).assertProperties([
      { propertyName: 'queueRegistration', typeProperty: 'object' },
    ]);
  };

  it('Should validate type QueueManagerConfig', () => {
    // arrange - act
    const QueueManagerConfig: QueueManagerConfig = {
      queueRegistration: [],
    };

    // assert
    _assertQueueManagerConfig(
      QueueManagerConfig,
      QueueManagerConfig.queueRegistration,
    );
    _assertPropertiesQueueManagerConfig(QueueManagerConfig);
  });
});
