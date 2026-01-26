import { testUtil } from '../../../../assets/';
import { LoggerMock, StorageProviderMock } from '../../../../assets/mocks';
import { QueueManagerImpl, StorageProvider } from '../../../../../src/internal';
import {
  HeartbeatTimeoutError,
  Logger,
  MaxExecutionTimeoutError,
  QueueNotRegisteredError,
  QueueRegistration,
  TimeoutWaitingToProcessError,
} from '../../../../../src/types';

describe('QueueManagerImpl', () => {
  let _storageProviderMock: testUtil.jest.JestMockedObj<StorageProvider>;
  let _loggerMock: testUtil.jest.JestMockedObj<Logger>;
  let _queueManager: QueueManagerImpl;
  let _queueRegistrations: QueueRegistration[];
  let _abortController: AbortController;

  const _defaultQueueName = 'test-queue';
  const _defaultResourceId = 'resource-1';
  const _defaultWaitTimeout = 5000;
  const _defaultExecutionTimeout = 5000;
  const _defaultHeartbeatInterval = 1000;

  beforeEach(() => {
    _storageProviderMock = new StorageProviderMock();
    _loggerMock = new LoggerMock();
    _abortController = new AbortController();

    _queueRegistrations = [
      {
        queueName: _defaultQueueName,
        parallelLimit: 1,
        queueTtlSeconds: 60,
      },
      {
        queueName: 'queue-no-ttl',
        parallelLimit: 5,
        // no queueTtlSeconds
      },
    ];

    jest
      .spyOn(global, 'AbortController')
      .mockImplementation(() => _abortController);
  });

  const _createInstance = (
    heartbeatInterval: number = _defaultHeartbeatInterval,
  ) => {
    // Setup mocks before instance creation (constructor calls these)
    _storageProviderMock.cleanupOrphansAsync.mockResolvedValue(undefined);
    _loggerMock.info.mockImplementation(() => {});

    _queueManager = new QueueManagerImpl(
      _storageProviderMock,
      _loggerMock,
      _queueRegistrations,
      heartbeatInterval,
    );
  };

  const _assertMocks = ({
    storageProvider,
    logger,
  }: {
    storageProvider?: {
      addToExecutionAsync?: testUtil.jest.AssertMock;
      addToWaitingQueueAsync?: testUtil.jest.AssertMock;
      getWaitingQueuePositionAsync?: testUtil.jest.AssertMock;
      promoteToExecutionAsync?: testUtil.jest.AssertMock;
      removeFromExecutionAsync?: testUtil.jest.AssertMock;
      removeFromWaitingQueueAsync?: testUtil.jest.AssertMock;
      cleanupOrphansAsync?: testUtil.jest.AssertMock;
      updateHeartbeatAsync?: testUtil.jest.AssertMock;
      removeHeartbeatAsync?: testUtil.jest.AssertMock;
      disconnectAsync?: testUtil.jest.AssertMock;
    };
    logger?: {
      info?: testUtil.jest.AssertMock;
      error?: testUtil.jest.AssertMock;
    };
  }) => {
    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.addToExecutionAsync,
      storageProvider?.addToExecutionAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.addToExecutionAsync?.params ?? []),
    );
    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.addToWaitingQueueAsync,
      storageProvider?.addToWaitingQueueAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.addToWaitingQueueAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.getWaitingQueuePositionAsync,
      storageProvider?.getWaitingQueuePositionAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.getWaitingQueuePositionAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.promoteToExecutionAsync,
      storageProvider?.promoteToExecutionAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.promoteToExecutionAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.removeFromExecutionAsync,
      storageProvider?.removeFromExecutionAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.removeFromExecutionAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.removeFromWaitingQueueAsync,
      storageProvider?.removeFromWaitingQueueAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.removeFromWaitingQueueAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.cleanupOrphansAsync,
      storageProvider?.cleanupOrphansAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.cleanupOrphansAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.updateHeartbeatAsync,
      storageProvider?.updateHeartbeatAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.updateHeartbeatAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.removeHeartbeatAsync,
      storageProvider?.removeHeartbeatAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.removeHeartbeatAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _storageProviderMock.disconnectAsync,
      storageProvider?.disconnectAsync?.timesToHaveBeenCalled ?? 0,
      ...(storageProvider?.disconnectAsync?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _loggerMock.info,
      logger?.info?.timesToHaveBeenCalled ?? 0,
      ...(logger?.info?.params ?? []),
    );

    testUtil.jest.assertJestSpyInstance(
      _loggerMock.error,
      logger?.error?.timesToHaveBeenCalled ?? 0,
      ...(logger?.error?.params ?? []),
    );
  };

  describe('Constructor', () => {
    it('should initialize and run startup orphan cleanup', () => {
      // arrange
      _storageProviderMock.cleanupOrphansAsync.mockResolvedValue(undefined);

      // act
      _createInstance();

      // assert
      _assertMocks({
        storageProvider: {
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue'],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 2,
            params: [expect.anything()],
          },
        },
      });
    });

    it('should handle error during startup orphan cleanup gracefully', async () => {
      // arrange
      const error = new Error('Cleanup failed');
      _storageProviderMock.cleanupOrphansAsync.mockRejectedValue(error);

      // act
      _createInstance();

      // assert
      // We need to wait a tiny bit since it's an unawaited promise in constructor
      await testUtil.utils.DelayUtil.Delay(10);
      _assertMocks({
        storageProvider: {
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 2,
            params: ['test-queue'],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 3,
            params: [expect.anything()],
          },
        },
      });
    });
  });

  describe('queueAsync', () => {
    beforeEach(() => {
      // Suppress initial logs from constructor to keep test clean (or we mock them)
      _storageProviderMock.cleanupOrphansAsync.mockResolvedValue(undefined);
      _loggerMock.info.mockImplementation(() => {});
      _createInstance();
      _loggerMock.info.mockClear(); // Clear constructor logs
      _storageProviderMock.cleanupOrphansAsync.mockClear();
    });

    it('should throw QueueNotRegisteredError if queue is not registered', async () => {
      // act & assert
      await expect(
        _queueManager.queueAsync({
          queueName: 'unknown-queue',
          resourceId: _defaultResourceId,
          waitTimeout: _defaultWaitTimeout,
          executionTimeout: _defaultExecutionTimeout,
          taskCallback: jest.fn(),
        }),
      ).rejects.toThrow(QueueNotRegisteredError);

      _assertMocks({
        storageProvider: {
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 1,
            params: [expect.anything()],
          },
        },
      });
    });

    it('should execute task immediately if slot is available (Happy Path)', async () => {
      // arrange
      const taskCallback = jest.fn().mockResolvedValue('result');
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(true);
      _storageProviderMock.updateHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);

      // act
      const result = await _queueManager.queueAsync({
        queueName: _defaultQueueName,
        resourceId: _defaultResourceId,
        waitTimeout: _defaultWaitTimeout,
        executionTimeout: _defaultExecutionTimeout,
        taskCallback,
      });

      // assert
      expect(result).toBe('result');
      expect(taskCallback).toHaveBeenCalled();

      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 3],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 8,
            params: [expect.anything()],
          },
        },
      });
    });

    it('should queue, wait, promote and execute task if immediate slot is unavailable', async () => {
      // arrange
      const taskCallback = jest.fn().mockResolvedValue('result');

      // 1. Fail to execute immediately
      _storageProviderMock.addToExecutionAsync.mockResolvedValueOnce(false);
      // 3. Add to waiting queue
      _storageProviderMock.addToWaitingQueueAsync.mockResolvedValue(true);

      // Poll logic:
      // Loop 1: Position 0 (Ready)
      _storageProviderMock.getWaitingQueuePositionAsync.mockResolvedValue(0);
      // Promote Success
      _storageProviderMock.promoteToExecutionAsync.mockResolvedValue(true);

      _storageProviderMock.updateHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeFromWaitingQueueAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);

      // act
      const result = await _queueManager.queueAsync({
        queueName: _defaultQueueName,
        resourceId: _defaultResourceId,
        waitTimeout: _defaultWaitTimeout,
        executionTimeout: _defaultExecutionTimeout,
        taskCallback,
      });

      // assert
      expect(result).toBe('result');

      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          addToWaitingQueueAsync: {
            timesToHaveBeenCalled: 1,
            params: [
              'test-queue',
              'resource-1',
              expect.any(String),
              10,
              60,
              false,
            ],
          },
          getWaitingQueuePositionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          promoteToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 3],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 9,
            params: [expect.anything()],
          },
        },
      });
    });

    it('should use default TTL if not provided in registration', async () => {
      // arrange
      const queueName = 'queue-no-ttl';
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(true);
      _storageProviderMock.updateHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(
        undefined,
      );

      // act
      await _queueManager.queueAsync({
        queueName,
        resourceId: _defaultResourceId,
        waitTimeout: 1000,
        executionTimeout: 1000,
        taskCallback: jest.fn(),
      });

      // assert
      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: [
              'queue-no-ttl',
              'resource-1',
              expect.any(String),
              5,
              6,
              604800,
            ],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl', 'resource-1', expect.any(String)],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl', 'resource-1', expect.any(String), 3],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl', 'resource-1', expect.any(String)],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 8,
            params: [expect.anything()],
          },
        },
      });
    });

    it('should sleep and retry polling when position is not 0 initially', async () => {
      // arrange
      jest.useFakeTimers();
      const taskCallback = jest.fn().mockResolvedValue('result');

      _storageProviderMock.addToExecutionAsync.mockResolvedValueOnce(false);
      _storageProviderMock.addToWaitingQueueAsync.mockResolvedValue(true);

      _storageProviderMock.getWaitingQueuePositionAsync
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      _storageProviderMock.promoteToExecutionAsync.mockResolvedValue(true);

      _storageProviderMock.updateHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeFromWaitingQueueAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);

      // act
      const queuePromise = _queueManager.queueAsync({
        queueName: _defaultQueueName,
        resourceId: _defaultResourceId,
        waitTimeout: _defaultWaitTimeout,
        executionTimeout: _defaultExecutionTimeout,
        taskCallback,
      });

      await jest.advanceTimersByTimeAsync(1100);

      const result = await queuePromise;

      // assert
      expect(result).toBe('result');

      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          addToWaitingQueueAsync: {
            timesToHaveBeenCalled: 1,
            params: [
              'test-queue',
              'resource-1',
              expect.any(String),
              10,
              60,
              false,
            ],
          },
          getWaitingQueuePositionAsync: {
            timesToHaveBeenCalled: 2,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          promoteToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 3],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 9,
            params: [expect.anything()],
          },
        },
      });

      jest.useRealTimers();
    });

    it('should throw TimeoutWaitingToProcessError if wait timeout exceeded', async () => {
      // arrange
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(false);
      _storageProviderMock.addToWaitingQueueAsync.mockResolvedValue(true);
      _storageProviderMock.removeFromWaitingQueueAsync.mockResolvedValue(
        undefined,
      );

      _loggerMock.error.mockImplementation(() => {});

      // poll loop immediately sees timeout
      const realDateNow = Date.now;
      const startTime = 1000;
      let nowCalls = 0;
      global.Date.now = jest.fn(() => {
        nowCalls++;
        if (nowCalls === 1) return startTime; // start
        return startTime + _defaultWaitTimeout + 1; // loop check
      });

      try {
        // act
        await _queueManager.queueAsync({
          queueName: _defaultQueueName,
          resourceId: _defaultResourceId,
          waitTimeout: _defaultWaitTimeout,
          executionTimeout: _defaultExecutionTimeout,
          taskCallback: jest.fn(),
        });
        fail('Should have thrown TimeoutWaitingToProcessError');
      } catch (error) {
        // assert
        expect(error).toBeInstanceOf(TimeoutWaitingToProcessError);
        _assertMocks({
          storageProvider: {
            addToExecutionAsync: {
              timesToHaveBeenCalled: 1,
              params: [
                'test-queue',
                'resource-1',
                expect.any(String),
                1,
                10,
                60,
              ],
            },
            addToWaitingQueueAsync: {
              timesToHaveBeenCalled: 1,
              params: [
                'test-queue',
                'resource-1',
                expect.any(String),
                10,
                60,
                false,
              ],
            },
            removeFromWaitingQueueAsync: {
              timesToHaveBeenCalled: 1,
              params: ['test-queue', 'resource-1', expect.any(String)],
            },
            cleanupOrphansAsync: {
              timesToHaveBeenCalled: 1,
              params: ['queue-no-ttl'],
            },
          },
          logger: {
            info: {
              timesToHaveBeenCalled: 5,
              params: [expect.anything()],
            },
            error: {
              timesToHaveBeenCalled: 1,
              params: [expect.anything(), expect.anything()],
            },
          },
        });
      } finally {
        global.Date.now = realDateNow;
      }
    });

    it('should throw Error if process disappears from waiting queue', async () => {
      // arrange
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(false);
      _storageProviderMock.addToWaitingQueueAsync.mockResolvedValue(true);
      _storageProviderMock.removeFromWaitingQueueAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.getWaitingQueuePositionAsync.mockResolvedValue(-1); // Not found
      _loggerMock.error.mockImplementation(() => {}); // Not found

      // act & assert
      await expect(
        _queueManager.queueAsync({
          queueName: _defaultQueueName,
          resourceId: _defaultResourceId,
          waitTimeout: _defaultWaitTimeout,
          executionTimeout: _defaultExecutionTimeout,
          taskCallback: jest.fn(),
        }),
      ).rejects.toThrow('not found in waiting queue');
      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          addToWaitingQueueAsync: {
            timesToHaveBeenCalled: 1,
            params: [
              'test-queue',
              'resource-1',
              expect.any(String),
              10,
              60,
              false,
            ],
          },
          removeFromWaitingQueueAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
          getWaitingQueuePositionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 5,
            params: [expect.anything()],
          },
          error: {
            timesToHaveBeenCalled: 1,
            params: [expect.anything(), expect.anything()],
          },
        },
      });
    });

    it('should throw MaxExecutionTimeoutError if task execution takes too long', async () => {
      // arrange
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(true);
      _storageProviderMock.updateHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);
      _loggerMock.error.mockImplementation(() => {});

      const taskCallback = jest.fn().mockImplementation(async () => {
        await testUtil.utils.DelayUtil.Delay(_defaultExecutionTimeout + 100);
      });

      // act & assert
      await expect(
        _queueManager.queueAsync({
          queueName: _defaultQueueName,
          resourceId: _defaultResourceId,
          waitTimeout: _defaultWaitTimeout,
          executionTimeout: _defaultExecutionTimeout,
          taskCallback,
        }),
      ).rejects.toThrow(MaxExecutionTimeoutError);
      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 5,
            params: ['test-queue', 'resource-1', expect.anything(), 3],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.anything()],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 11,
            params: [expect.anything()],
          },
          error: {
            timesToHaveBeenCalled: 1,
            params: [expect.anything(), expect.anything()],
          },
        },
      });
    });

    it('should abort task and throw HeartbeatTimeoutError if heartbeat fails', async () => {
      // arrange
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(true);
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);

      // First heartbeat ok
      _storageProviderMock.updateHeartbeatAsync.mockResolvedValueOnce(
        undefined,
      );
      // Interval heartbeat fails
      const error = new Error('Redis down');
      _storageProviderMock.updateHeartbeatAsync.mockRejectedValue(error);

      const abortSpy = jest.spyOn(_abortController, 'abort');

      const taskCallback = jest.fn().mockImplementation(async () => {
        return new Promise(() => {});
      });

      _loggerMock.error.mockImplementation(() => {});

      // act & assert
      await expect(
        _queueManager.queueAsync({
          queueName: _defaultQueueName,
          resourceId: _defaultResourceId,
          waitTimeout: _defaultWaitTimeout,
          executionTimeout: _defaultExecutionTimeout,
          taskCallback,
        }),
      ).rejects.toThrow(HeartbeatTimeoutError);
      expect(abortSpy).toHaveBeenCalled();
      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 2,
            params: ['test-queue', 'resource-1', expect.anything(), 3],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.anything()],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 7,
            params: [expect.anything()],
          },
          error: {
            timesToHaveBeenCalled: 2,
            params: [expect.anything(), expect.anything()],
          },
        },
      });
    });

    it('should use errorHandler if provided and error occurs', async () => {
      // arrange
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(true);
      _storageProviderMock.updateHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);
      _loggerMock.error.mockImplementation(() => {});

      const originalError = new Error('Task Failed');
      const taskCallback = jest.fn().mockRejectedValue(originalError);
      const errorHandler = jest.fn().mockResolvedValue('fallback-result');

      // act
      const result = await _queueManager.queueAsync({
        queueName: _defaultQueueName,
        resourceId: _defaultResourceId,
        waitTimeout: _defaultWaitTimeout,
        executionTimeout: _defaultExecutionTimeout,
        taskCallback,
        errorHandler,
      });

      // assert
      expect(errorHandler).toHaveBeenCalledWith(originalError);
      expect(result).toBe('fallback-result');
      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.anything(), 3],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.anything()],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 7,
            params: [expect.anything()],
          },
          error: {
            timesToHaveBeenCalled: 1,
            params: [expect.anything(), expect.anything()],
          },
        },
      });
    });

    it('should rethrow error from errorHandler', async () => {
      // arrange
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(true);
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(true);
      _storageProviderMock.updateHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);
      _loggerMock.error.mockImplementation(() => {});

      const originalError = new Error('Task Failed');
      const handlerError = new Error('Handler Failed');
      const taskCallback = jest.fn().mockRejectedValue(originalError);
      const errorHandler = jest.fn().mockRejectedValue(handlerError);

      // act & assert
      await expect(
        _queueManager.queueAsync({
          queueName: _defaultQueueName,
          resourceId: _defaultResourceId,
          waitTimeout: _defaultWaitTimeout,
          executionTimeout: _defaultExecutionTimeout,
          taskCallback,
          errorHandler,
        }),
      ).rejects.toThrow(handlerError);
      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.anything(), 3],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.anything()],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 7,
            params: [expect.anything()],
          },
          error: {
            timesToHaveBeenCalled: 2,
            params: [expect.anything(), expect.anything()],
          },
        },
      });
    });

    it('should rethrow original error if no errorHandler is provided', async () => {
      // arrange
      _storageProviderMock.addToExecutionAsync.mockResolvedValue(true);
      _storageProviderMock.updateHeartbeatAsync.mockResolvedValue(undefined);
      _storageProviderMock.removeFromExecutionAsync.mockResolvedValue(
        undefined,
      );
      _storageProviderMock.removeHeartbeatAsync.mockResolvedValue(undefined);
      _loggerMock.error.mockImplementation(() => {});

      const originalError = new Error('Task Failed');
      const taskCallback = jest.fn().mockRejectedValue(originalError);

      // act & assert
      await expect(
        _queueManager.queueAsync({
          queueName: _defaultQueueName,
          resourceId: _defaultResourceId,
          waitTimeout: _defaultWaitTimeout,
          executionTimeout: _defaultExecutionTimeout,
          taskCallback,
        }),
      ).rejects.toThrow(originalError);
      _assertMocks({
        storageProvider: {
          addToExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String), 1, 10, 60],
          },
          removeFromExecutionAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.any(String)],
          },
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 1,
            params: ['queue-no-ttl'],
          },
          updateHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.anything(), 3],
          },
          removeHeartbeatAsync: {
            timesToHaveBeenCalled: 1,
            params: ['test-queue', 'resource-1', expect.anything()],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 7,
            params: [expect.anything()],
          },
          error: {
            timesToHaveBeenCalled: 1,
            params: [expect.anything(), expect.anything()],
          },
        },
      });
    });
  });

  describe('disconnectAsync', () => {
    beforeEach(() => {
      _storageProviderMock.cleanupOrphansAsync.mockResolvedValue(undefined);
      _createInstance();
    });

    it('should call provider disconnect', async () => {
      // arrange
      _storageProviderMock.disconnectAsync.mockResolvedValue(undefined);

      // act
      await _queueManager.disconnectAsync();

      // assert
      _assertMocks({
        storageProvider: {
          cleanupOrphansAsync: {
            timesToHaveBeenCalled: 2,
            params: ['test-queue'],
          },
          disconnectAsync: { timesToHaveBeenCalled: 1, params: [] },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 3,
            params: [expect.anything()],
          },
        },
      });
    });
  });
});
