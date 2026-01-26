import { testUtil } from '../../../../assets';
import { LoggerMock } from '../../../../assets/mocks';
import {
  StorageProviderFactory,
  ValKeyStorageProvider,
} from '../../../../../src/internal';
import {
  Logger,
  ProviderType,
  StorageConfig,
  StorageConfigValKeyConnectionDetails,
} from '../../../../../src/types';

// Mock ValKeyStorageProvider
jest.mock(
  '../../../../../src/internal/storage-providers/providers/ValKeyStorageProvider',
);

describe('StorageProviderFactory', () => {
  let _loggerMock: testUtil.jest.JestMockedObj<Logger>;
  let _serviceName: string;
  let _connectionDetails: StorageConfigValKeyConnectionDetails;

  beforeEach(() => {
    _loggerMock = new LoggerMock();
    _serviceName = 'test-service';
    _connectionDetails = {
      host: 'localhost',
      port: 6379,
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  const _assertMocks = ({
    valKeyStorageProvider,
    logger,
  }: {
    valKeyStorageProvider?: {
      constructor?: testUtil.jest.AssertMock;
    };
    logger?: {
      info?: testUtil.jest.AssertMock;
      error?: testUtil.jest.AssertMock;
    };
  }) => {
    if (valKeyStorageProvider?.constructor) {
      testUtil.jest.assertJestSpyInstance(
        ValKeyStorageProvider as jest.MockedClass<typeof ValKeyStorageProvider>,
        valKeyStorageProvider.constructor.timesToHaveBeenCalled,
        ...valKeyStorageProvider.constructor.params,
      );
    }

    if (logger?.info) {
      testUtil.jest.assertJestSpyInstance(
        _loggerMock.info,
        logger.info.timesToHaveBeenCalled,
        ...logger.info.params,
      );
    }

    if (logger?.error) {
      testUtil.jest.assertJestSpyInstance(
        _loggerMock.error,
        logger.error.timesToHaveBeenCalled,
        ...logger.error.params,
      );
    }
  };

  describe('create', () => {
    it('should create ValKeyStorageProvider when provider type is VALKEY', () => {
      // arrange
      const storageConfig: StorageConfig = {
        providerType: ProviderType.VALKEY,
        connectionDetails: _connectionDetails,
      };

      // act
      const result = StorageProviderFactory.create(
        storageConfig,
        _loggerMock,
        _serviceName,
      );

      // assert
      expect(result).toBeInstanceOf(ValKeyStorageProvider);
      _assertMocks({
        valKeyStorageProvider: {
          constructor: {
            timesToHaveBeenCalled: 1,
            params: [_connectionDetails, _loggerMock, _serviceName],
          },
        },
      });
    });

    it('should throw error for unsupported provider type', () => {
      // arrange
      const storageConfig: StorageConfig = {
        providerType: 'UNSUPPORTED' as ProviderType,
        connectionDetails: _connectionDetails,
      };

      // act & assert
      expect(() =>
        StorageProviderFactory.create(storageConfig, _loggerMock, _serviceName),
      ).toThrow('Unsupported provider type: UNSUPPORTED');
      _assertMocks({});
    });
  });
});
