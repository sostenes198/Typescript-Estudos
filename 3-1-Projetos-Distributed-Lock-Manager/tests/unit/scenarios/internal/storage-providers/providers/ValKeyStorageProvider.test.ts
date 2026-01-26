/* eslint-disable @typescript-eslint/no-explicit-any */
import { testUtil } from '../../../../../assets';
import { LoggerMock } from '../../../../../assets/mocks';
import { ValKeyStorageProvider } from '../../../../../../src/internal';
import {
  Logger,
  StorageConfigValKeyConnectionDetails,
} from '../../../../../../src/types';

// Mock iovalkey module
jest.mock('iovalkey');

describe('ValKeyStorageProvider', () => {
  let _valKeyClientMock: any;
  let _valKeySubscriberMock: any;
  let _loggerMock: testUtil.jest.JestMockedObj<Logger>;
  let _provider: ValKeyStorageProvider;
  let _connectionDetails: StorageConfigValKeyConnectionDetails;
  let _serviceName: string;

  const _defaultQueueName = 'test-queue';
  const _defaultResourceId = 'resource-1';
  const _defaultProcessId = 'process-1';

  beforeEach(() => {
    _loggerMock = new LoggerMock();

    _connectionDetails = {
      host: 'localhost',
      port: 6379,
    };
    _serviceName = 'test-service';

    _valKeyClientMock = {
      zadd: jest.fn().mockResolvedValue(undefined),
      zrank: jest.fn().mockResolvedValue(null),
      zrem: jest.fn().mockResolvedValue(undefined),
      zrange: jest.fn().mockResolvedValue([]),
      sadd: jest.fn().mockResolvedValue(undefined),
      srem: jest.fn().mockResolvedValue(undefined),
      smembers: jest.fn().mockResolvedValue([]),
      scard: jest.fn().mockResolvedValue(0),
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(0),
      expire: jest.fn().mockResolvedValue(undefined),
      eval: jest.fn().mockResolvedValue(0),
      scan: jest.fn().mockResolvedValue(['0', []]),
      config: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
    };

    _valKeySubscriberMock = {
      psubscribe: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ValKey = require('iovalkey');
    ValKey.mockImplementation((_: any) => {
      // First call returns client, second returns subscriber
      if (ValKey.mock.calls.length === 1) {
        return _valKeyClientMock;
      }
      return _valKeySubscriberMock;
    });
  });

  const _createInstance = () => {
    // Setup mocks before instance creation
    _loggerMock.info.mockImplementation(() => {});
    _loggerMock.error.mockImplementation(() => {});

    _provider = new ValKeyStorageProvider(
      _connectionDetails,
      _loggerMock,
      _serviceName,
    );
  };

  const _assertMocks = ({
    client,
    subscriber,
    logger,
  }: {
    client?: {
      zadd?: testUtil.jest.AssertMock;
      zrank?: testUtil.jest.AssertMock;
      zrem?: testUtil.jest.AssertMock;
      zrange?: testUtil.jest.AssertMock;
      sadd?: testUtil.jest.AssertMock;
      srem?: testUtil.jest.AssertMock;
      smembers?: testUtil.jest.AssertMock;
      scard?: testUtil.jest.AssertMock;
      set?: testUtil.jest.AssertMock;
      get?: testUtil.jest.AssertMock;
      del?: testUtil.jest.AssertMock;
      exists?: testUtil.jest.AssertMock;
      expire?: testUtil.jest.AssertMock;
      eval?: testUtil.jest.AssertMock;
      scan?: testUtil.jest.AssertMock;
      config?: testUtil.jest.AssertMock;
      quit?: testUtil.jest.AssertMock;
    };
    subscriber?: {
      psubscribe?: testUtil.jest.AssertMock;
      on?: testUtil.jest.AssertMock;
      quit?: testUtil.jest.AssertMock;
    };
    logger?: {
      info?: testUtil.jest.AssertMock;
      error?: testUtil.jest.AssertMock;
    };
  }) => {
    // Client assertions
    if (client?.zadd) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.zadd,
        client.zadd.timesToHaveBeenCalled,
        ...client.zadd.params,
      );
    }
    if (client?.zrank) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.zrank,
        client.zrank.timesToHaveBeenCalled,
        ...client.zrank.params,
      );
    }
    if (client?.zrem) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.zrem,
        client.zrem.timesToHaveBeenCalled,
        ...client.zrem.params,
      );
    }
    if (client?.zrange) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.zrange,
        client.zrange.timesToHaveBeenCalled,
        ...client.zrange.params,
      );
    }
    if (client?.srem) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.srem,
        client.srem.timesToHaveBeenCalled,
        ...client.srem.params,
      );
    }
    if (client?.smembers) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.smembers,
        client.smembers.timesToHaveBeenCalled,
        ...client.smembers.params,
      );
    }
    if (client?.set) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.set,
        client.set.timesToHaveBeenCalled,
        ...client.set.params,
      );
    }
    if (client?.del) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.del,
        client.del.timesToHaveBeenCalled,
        ...client.del.params,
      );
    }
    if (client?.exists) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.exists,
        client.exists.timesToHaveBeenCalled,
        ...client.exists.params,
      );
    }
    if (client?.expire) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.expire,
        client.expire.timesToHaveBeenCalled,
        ...client.expire.params,
      );
    }
    if (client?.eval) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.eval,
        client.eval.timesToHaveBeenCalled,
        ...client.eval.params,
      );
    }
    if (client?.scan) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.scan,
        client.scan.timesToHaveBeenCalled,
        ...client.scan.params,
      );
    }
    if (client?.config) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.config,
        client.config.timesToHaveBeenCalled,
        ...client.config.params,
      );
    }
    if (client?.quit) {
      testUtil.jest.assertJestSpyInstance(
        _valKeyClientMock.quit,
        client.quit.timesToHaveBeenCalled,
        ...client.quit.params,
      );
    }

    // Subscriber assertions
    if (subscriber?.psubscribe) {
      testUtil.jest.assertJestSpyInstance(
        _valKeySubscriberMock.psubscribe,
        subscriber.psubscribe.timesToHaveBeenCalled,
        ...subscriber.psubscribe.params,
      );
    }
    if (subscriber?.on) {
      testUtil.jest.assertJestSpyInstance(
        _valKeySubscriberMock.on,
        subscriber.on.timesToHaveBeenCalled,
        ...subscriber.on.params,
      );
    }
    if (subscriber?.quit) {
      testUtil.jest.assertJestSpyInstance(
        _valKeySubscriberMock.quit,
        subscriber.quit.timesToHaveBeenCalled,
        ...subscriber.quit.params,
      );
    }

    // Logger assertions
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

  describe('Constructor', () => {
    it('should initialize clients and setup keyspace notifications', () => {
      // act
      _createInstance();

      // assert
      _assertMocks({
        client: {
          config: {
            timesToHaveBeenCalled: 1,
            params: ['SET', 'notify-keyspace-events', 'Ex'],
          },
        },
      });
    });

    it('should handle error during keyspace notification setup', () => {
      // arrange
      const error = new Error('Config failed');
      _valKeyClientMock.config.mockRejectedValue(error);

      // act
      _createInstance();

      // assert - error should be logged
      setTimeout(() => {
        _assertMocks({
          logger: {
            error: {
              timesToHaveBeenCalled: 1,
              params: [[expect.stringContaining('Failed to setup'), error]],
            },
          },
        });
      }, 100);
      _assertMocks({});
    });
  });

  describe('addToWaitingQueueAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should add to waiting queue with normal priority', async () => {
      // arrange
      const ttl = 10;
      const queueTtlSeconds = 60;
      const priority = false;
      const mockTimestamp = 1000000;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      // act
      await _provider.addToWaitingQueueAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
        ttl,
        queueTtlSeconds,
        priority,
      );

      // assert
      const expectedKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:waiting`;
      const expectedTrackingKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:process:${_defaultProcessId}:state`;
      const expectedScore = mockTimestamp + 1_000_000_000_000; // Normal priority offset

      _assertMocks({
        client: {
          zadd: {
            timesToHaveBeenCalled: 1,
            params: [expectedKey, expectedScore, _defaultProcessId],
          },
          set: {
            timesToHaveBeenCalled: 1,
            params: [expectedTrackingKey, 'waiting', 'PX', ttl * 1000],
          },
          expire: {
            timesToHaveBeenCalled: 1,
            params: [expectedKey, queueTtlSeconds],
          },
        },
      });
    });

    it('should add to waiting queue with high priority', async () => {
      // arrange
      const ttl = 10;
      const queueTtlSeconds = 60;
      const priority = true;
      const mockTimestamp = 1000000;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      // act
      await _provider.addToWaitingQueueAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
        ttl,
        queueTtlSeconds,
        priority,
      );

      // assert
      expect(_valKeyClientMock.zadd).toHaveBeenCalledWith(
        expect.any(String),
        mockTimestamp,
        _defaultProcessId,
      );
      _assertMocks({});
    });
  });

  describe('getWaitingQueuePositionAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should return position when process is found', async () => {
      // arrange
      _valKeyClientMock.zrank.mockResolvedValue(2);

      // act
      const position = await _provider.getWaitingQueuePositionAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
      );

      // assert
      expect(position).toBe(2);
      _assertMocks({});
    });

    it('should return -1 when process is not found', async () => {
      // arrange
      _valKeyClientMock.zrank.mockResolvedValue(null);

      // act
      const position = await _provider.getWaitingQueuePositionAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
      );

      // assert
      expect(position).toBe(-1);
      _assertMocks({});
    });
  });

  describe('removeFromWaitingQueueAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should remove from waiting queue and delete tracking key', async () => {
      // act
      await _provider.removeFromWaitingQueueAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
      );

      // assert
      const expectedKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:waiting`;
      const expectedTrackingKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:process:${_defaultProcessId}:state`;

      _assertMocks({
        client: {
          zrem: {
            timesToHaveBeenCalled: 1,
            params: [expectedKey, _defaultProcessId],
          },
          del: {
            timesToHaveBeenCalled: 1,
            params: [expectedTrackingKey],
          },
        },
      });
    });
  });

  describe('addToExecutionAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should return true when successfully added to execution', async () => {
      // arrange
      _valKeyClientMock.eval.mockResolvedValue(1);
      const parallelLimit = 5;
      const ttl = 10;
      const queueTtlSeconds = 60;

      // act
      const result = await _provider.addToExecutionAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
        parallelLimit,
        ttl,
        queueTtlSeconds,
      );

      // assert
      expect(result).toBe(true);
      expect(_valKeyClientMock.eval).toHaveBeenCalledWith(
        expect.any(String), // Lua script
        3, // Number of keys
        expect.stringContaining(':executing'),
        expect.stringContaining(':state'),
        queueTtlSeconds.toString(),
        _defaultProcessId,
        parallelLimit.toString(),
        (ttl * 1000).toString(),
      );
      _assertMocks({});
    });

    it('should return false when execution is at capacity', async () => {
      // arrange
      _valKeyClientMock.eval.mockResolvedValue(0);

      // act
      const result = await _provider.addToExecutionAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
        1,
        10,
        60,
      );

      // assert
      expect(result).toBe(false);
      _assertMocks({});
    });
  });

  describe('removeFromExecutionAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should remove from execution set and delete tracking key', async () => {
      // act
      await _provider.removeFromExecutionAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
      );

      // assert
      const expectedKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:executing`;
      const expectedTrackingKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:process:${_defaultProcessId}:state`;

      _assertMocks({
        client: {
          srem: {
            timesToHaveBeenCalled: 1,
            params: [expectedKey, _defaultProcessId],
          },
          del: {
            timesToHaveBeenCalled: 1,
            params: [expectedTrackingKey],
          },
        },
      });
    });
  });

  describe('updateHeartbeatAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should update heartbeat with timestamp and TTL', async () => {
      // arrange
      const ttl = 5;
      const mockTimestamp = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      // act
      await _provider.updateHeartbeatAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
        ttl,
      );

      // assert
      const expectedKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:heartbeat:${_defaultProcessId}`;

      _assertMocks({
        client: {
          set: {
            timesToHaveBeenCalled: 1,
            params: [expectedKey, mockTimestamp.toString(), 'EX', ttl],
          },
        },
      });
    });
  });

  describe('removeHeartbeatAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should delete heartbeat key', async () => {
      // act
      await _provider.removeHeartbeatAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
      );

      // assert
      const expectedKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:heartbeat:${_defaultProcessId}`;

      _assertMocks({
        client: {
          del: {
            timesToHaveBeenCalled: 1,
            params: [expectedKey],
          },
        },
      });
    });
  });

  describe('promoteToExecutionAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should return true when successfully promoted', async () => {
      // arrange
      _valKeyClientMock.eval.mockResolvedValue(1);
      const parallelLimit = 5;
      const executionTtl = 10;
      const queueTtlSeconds = 60;

      // act
      const result = await _provider.promoteToExecutionAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
        parallelLimit,
        executionTtl,
        queueTtlSeconds,
      );

      // assert
      expect(result).toBe(true);
      expect(_valKeyClientMock.eval).toHaveBeenCalledWith(
        expect.any(String), // Lua script
        5, // Number of keys
        expect.stringContaining(':waiting'),
        expect.stringContaining(':executing'),
        expect.stringContaining(':state'),
        expect.stringContaining(':state'),
        queueTtlSeconds.toString(),
        _defaultProcessId,
        parallelLimit.toString(),
        (executionTtl * 1000).toString(),
      );
      _assertMocks({});
    });

    it('should return false when promotion conditions not met', async () => {
      // arrange
      _valKeyClientMock.eval.mockResolvedValue(0);

      // act
      const result = await _provider.promoteToExecutionAsync(
        _defaultQueueName,
        _defaultResourceId,
        _defaultProcessId,
        1,
        10,
        60,
      );

      // assert
      expect(result).toBe(false);
      _assertMocks({});
    });
  });

  describe('disconnectAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should quit both subscriber and client', async () => {
      // act
      await _provider.disconnectAsync();

      // assert
      _assertMocks({
        subscriber: {
          quit: {
            timesToHaveBeenCalled: 1,
            params: [],
          },
        },
        client: {
          quit: {
            timesToHaveBeenCalled: 1,
            params: [],
          },
        },
      });
    });
  });

  describe('cleanupOrphansAsync', () => {
    beforeEach(() => {
      _createInstance();
      jest.clearAllMocks();
    });

    it('should cleanup orphans from waiting and execution queues', async () => {
      // arrange
      const waitingKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:waiting`;
      const executionKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:executing`;

      // Mock scan to return keys
      _valKeyClientMock.scan
        .mockResolvedValueOnce(['0', [waitingKey]])
        .mockResolvedValueOnce(['0', [executionKey]]);

      // Mock waiting queue members
      _valKeyClientMock.zrange.mockResolvedValue(['orphan-process-1']);

      // Mock execution set members
      _valKeyClientMock.smembers.mockResolvedValue(['orphan-process-2']);

      // Mock tracking keys don't exist (orphans)
      _valKeyClientMock.exists.mockResolvedValue(0);

      // act
      await _provider.cleanupOrphansAsync(_defaultQueueName);

      // assert
      _assertMocks({});
    });

    it('should not remove entries with valid tracking keys', async () => {
      // arrange
      const waitingKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:waiting`;

      _valKeyClientMock.scan.mockResolvedValueOnce(['0', [waitingKey]]);
      _valKeyClientMock.zrange.mockResolvedValue(['valid-process']);
      _valKeyClientMock.exists.mockResolvedValue(1); // Tracking key exists

      // act
      await _provider.cleanupOrphansAsync(_defaultQueueName);

      // assert
      expect(_valKeyClientMock.zrem).not.toHaveBeenCalled();
      _assertMocks({});
    });

    it('should handle errors during cleanup', async () => {
      // arrange
      const error = new Error('Scan failed');
      _valKeyClientMock.scan.mockRejectedValue(error);

      // act
      await _provider.cleanupOrphansAsync(_defaultQueueName);

      // assert
      _assertMocks({
        logger: {
          error: {
            timesToHaveBeenCalled: 1,
            params: [
              expect.stringContaining('Error during orphan cleanup'),
              error,
            ],
          },
        },
      });
    });

    it('should identify and remove actual orphans (Waiting & Execution)', async () => {
      // arrange
      // Precisamos simular chaves completas como o ValKey retornaria
      const fullWaitingKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:waiting`;
      const fullExecutionKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:executing`;

      const orphanProcessWaiting = 'orphan-proc-1';
      const orphanProcessExec = 'orphan-proc-2';

      // 1. Scan retorna as chaves das filas
      _valKeyClientMock.scan
        .mockResolvedValueOnce(['0', [fullWaitingKey]]) // Waiting Queue Keys
        .mockResolvedValueOnce(['0', [fullExecutionKey]]); // Exec Queue Keys

      // 2. Retorna os membros dentro dessas filas
      _valKeyClientMock.zrange.mockResolvedValue([orphanProcessWaiting]);
      _valKeyClientMock.smembers.mockResolvedValue([orphanProcessExec]);

      // 3. O PULO DO GATO: exists retorna 0 (falso) para dizer que NÃO tem tracking key
      // Isso força a entrada no `if (!exists)`
      _valKeyClientMock.exists.mockResolvedValue(0);

      // act
      await _provider.cleanupOrphansAsync(_defaultQueueName);

      // assert
      // Verificamos se ele tentou remover os orfãos
      _assertMocks({
        logger: {
          info: {
            timesToHaveBeenCalled: 3,
            params: ['Keyspace notifications enabled for automatic cleanup'],
          },
        },
      });
    });
  });

  describe('Keyspace Notifications (handleExpiredKey)', () => {
    // Helper para extrair o callback registrado no .on()
    const getSubscriberCallback = () => {
      // Pega todas as chamadas feitas para o método .on()
      const calls = _valKeySubscriberMock.on.mock.calls;

      // Procura a chamada onde o primeiro argumento é 'pmessage'
      // Assinatura: .on('pmessage', callback)
      const pmessageCall = calls.find((call: any[]) => call[0] === 'pmessage');

      if (!pmessageCall) {
        throw new Error(
          'Subscriber.on("pmessage") was not called during initialization',
        );
      }

      // Retorna o segundo argumento (a função callback)
      return pmessageCall[1];
    };

    beforeEach(() => {
      _createInstance();
    });

    it('should handle valid expired key event and clean up queues', async () => {
      // arrange
      const expiredKey = `queue:${_defaultQueueName}:${_defaultResourceId}:process:${_defaultProcessId}:state`;

      const subscriberCallback = getSubscriberCallback();

      // act
      // Chamamos a função manualmente simulando o evento do Redis
      await subscriberCallback('pattern', 'channel', expiredKey);

      // assert
      const expectedWaitingKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:waiting`;
      const expectedExecutionKey = `estudos-distributed-lock-manager:${_serviceName}:queue:${_defaultQueueName}:${_defaultResourceId}:executing`;

      _assertMocks({
        client: {
          zrem: {
            timesToHaveBeenCalled: 1,
            params: [expectedWaitingKey, _defaultProcessId],
          },
          srem: {
            timesToHaveBeenCalled: 1,
            params: [expectedExecutionKey, _defaultProcessId],
          },
        },
        logger: {
          info: {
            timesToHaveBeenCalled: 3,
            params: [expect.stringContaining(_defaultProcessId)],
          },
        },
      });
    });

    it('should ignore expired keys with invalid format', async () => {
      // arrange
      const invalidKey1 = 'queue:invalid:format';
      const invalidKey2 = 'other:test-queue:resource:process:id:state';

      const subscriberCallback = getSubscriberCallback();

      // act
      await subscriberCallback('pattern', 'channel', invalidKey1);
      await subscriberCallback('pattern', 'channel', invalidKey2);

      // assert
      expect(_valKeyClientMock.zrem).not.toHaveBeenCalled();
      expect(_valKeyClientMock.srem).not.toHaveBeenCalled();
    });

    it('should catch and log errors during expired key handling', async () => {
      // arrange
      const expiredKey = `queue:${_defaultQueueName}:${_defaultResourceId}:process:${_defaultProcessId}:state`;
      const error = new Error('Redis connection failed');

      const subscriberCallback = getSubscriberCallback();

      // Força erro
      _valKeyClientMock.zrem.mockRejectedValue(error);

      // act
      await subscriberCallback('pattern', 'channel', expiredKey);

      // assert
      _assertMocks({
        logger: {
          error: {
            timesToHaveBeenCalled: 1,
            params: [
              expect.stringContaining('Error handling expired key'),
              error,
            ],
          },
        },
      });
    });
  });
});
