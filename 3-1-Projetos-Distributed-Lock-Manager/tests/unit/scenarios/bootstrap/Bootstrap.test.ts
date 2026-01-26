import { testUtil } from '../../../assets/';
import {
  LoggerMock,
  MockStorageProviderFactory,
  StorageProviderFactoryMock,
  StorageProviderMock,
} from '../../../assets/mocks';
import { Bootstrap } from '../../../../src';
import {
  Logger,
  ProviderType,
  QueueManagerConfig,
  StorageConfig,
} from '../../../../src/types';
import { cleanQueueManager } from '../../../../src/bootstrap';
import { StorageProvider } from '../../../../src/internal';

describe('Bootstrap', () => {
  let _storageProviderFactoryMock: testUtil.jest.JestMockedObj<MockStorageProviderFactory>;
  let _storageProviderMock: testUtil.jest.JestMockedObj<StorageProvider>;
  let _loggerMock: testUtil.jest.JestMockedObj<Logger>;

  let _queueManagerConfig: QueueManagerConfig;
  let _heartbeatInterval: number;
  let _serviceName: string;

  const _cleanToTest = (): void => {
    cleanQueueManager();
  };

  beforeEach(() => {
    _cleanToTest();
    _storageProviderFactoryMock = StorageProviderFactoryMock.mock();
    _storageProviderMock = new StorageProviderMock();
    _loggerMock = new LoggerMock();

    _queueManagerConfig = {
      queueRegistration: [],
    };
    _heartbeatInterval = 1_000;
    _serviceName = 'service-name';
  });

  afterAll(() => {
    _cleanToTest();
  });

  const _assertMocks = ({
    storageProviderFactory,
    storageProvider,
  }: {
    storageProviderFactory?: {
      create?: testUtil.jest.AssertMock;
    };
    storageProvider?: {
      disconnectAsync?: testUtil.jest.AssertMock;
    };
  }) => {
    testUtil.jest.assertJestSpyInstance(
      _storageProviderFactoryMock.create,
      storageProviderFactory?.create?.timesToHaveBeenCalled ?? 0,
      ...(storageProviderFactory?.create?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.disconnectAsync,
      storageProvider?.disconnectAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.disconnectAsync?.params ?? []),
    );
  };

  describe('ProviderType.VALKEY', () => {
    let _storageConfig: StorageConfig;

    beforeEach(() => {
      _storageConfig = {
        providerType: ProviderType.VALKEY,
        connectionDetails: {
          host: 'host',
          port: 123,
        },
      };
    });

    it('initialize: should initialize QueueManager correctly and disconnect', async () => {
      // arrange
      _storageProviderFactoryMock.create.mockReturnValue(_storageProviderMock);

      _storageProviderMock.disconnectAsync.mockResolvedValue(undefined);

      _loggerMock.info.mockImplementation(() => {});

      // act
      await Bootstrap.initialize({
        serviceName: _serviceName,
        storageConfig: _storageConfig,
        queueManagerConfig: _queueManagerConfig,
        logger: _loggerMock,
        heartbeatInterval: _heartbeatInterval,
      });

      await Bootstrap.closeAsync();

      // assert
      _assertMocks({
        storageProviderFactory: {
          create: {
            timesToHaveBeenCalled: 1,
            params: [_storageConfig, _loggerMock, _serviceName],
          },
        },
        storageProvider: {
          disconnectAsync: {
            timesToHaveBeenCalled: 1,
            params: [],
          },
        },
      });
    });
  });
});
