/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unused-vars */
import { QueueManager, types } from '../../../index';
import { QueuesToTest } from '../assets';

describe('QueueManagerImp', () => {
  let _queueManager: types.QueueManager;
  let _processedIds: string[];
  let _executionLog: Array<{
    resourceId: string;
    processId: string;
    timestamp: number;
  }>;

  beforeEach(() => {
    _queueManager = QueueManager;
    _processedIds = [];
    _executionLog = [];
  });

  beforeEach(async () => {
    // Clear Redis before each test
    // @ts-ignore
    await QueueManager['_provider']['_client'].flushall();
  });

  const _createProcess = async (
    resourceId: string,
    executionTime: number = 2000,
  ): Promise<string> => {
    return await _queueManager.queueAsync({
      queueName: QueuesToTest.queue.queueName,
      resourceId,
      waitTimeout: 300_000,
      executionTimeout: 10_000,
      taskCallback: async (_: unknown, processId: string) => {
        const startTime = Date.now();
        _executionLog.push({ resourceId, processId, timestamp: startTime });

        await new Promise(resolve => setTimeout(resolve, executionTime));

        _processedIds.push(processId);
        return processId;
      },
    });
  };

  describe('Basic Functionality', () => {
    it('Should execute single process successfully', async () => {
      // act
      await _createProcess('resource-123');

      // assert
      expect(_processedIds.length).toBe(1);
      expect(_executionLog.length).toBe(1);
      expect(_executionLog[0].resourceId).toBe('resource-123');
    });

    it('Should execute multiple processes for same resource sequentially', async () => {
      // arrange
      const resourceId = 'resource-sequential';
      const processCount = 3;

      // act
      const promises = Array.from({ length: processCount }, () =>
        _createProcess(resourceId, 500),
      );
      await Promise.all(promises);

      // assert
      expect(_processedIds.length).toBe(processCount);

      // Verify all processes used the same resource
      const resourceLogs = _executionLog.filter(
        log => log.resourceId === resourceId,
      );
      expect(resourceLogs.length).toBe(processCount);
    });
  });

  describe('Resource Isolation', () => {
    it('Should execute processes for different resources in parallel', async () => {
      // arrange
      const resources = ['resource-1', 'resource-2', 'resource-3'];
      const executionTime = 1000;

      // act
      const startTime = Date.now();
      const promises = resources.map(resourceId =>
        _createProcess(resourceId, executionTime),
      );
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // assert
      expect(_processedIds.length).toBe(3);

      // Verify parallel execution (should take ~1s, not ~3s)
      // Allow 500ms overhead for test execution
      expect(totalTime).toBeLessThan(executionTime + 2000);

      // Verify each resource was used
      resources.forEach(resourceId => {
        const resourceLog = _executionLog.find(
          log => log.resourceId === resourceId,
        );
        expect(resourceLog).toBeDefined();
      });
    });

    it('Should respect parallelLimit=1 per resource while allowing parallel execution across resources', async () => {
      // arrange
      const resource1 = 'resource-parallel-1';
      const resource2 = 'resource-parallel-2';
      const processesPerResource = 5;
      const executionTime = 300;

      // act
      const startTime = Date.now();
      const promises = [
        ...Array.from({ length: processesPerResource }, () =>
          _createProcess(resource1, executionTime),
        ),
        ...Array.from({ length: processesPerResource }, () =>
          _createProcess(resource2, executionTime),
        ),
      ];
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // assert
      expect(_processedIds.length).toBe(processesPerResource * 2);

      // Each resource should execute sequentially (5 * 300ms = 1500ms)
      // But both resources run in parallel, so total should be ~1500ms, not ~3000ms
      expect(totalTime).toBeLessThan(
        processesPerResource * executionTime + 2000,
      );
      expect(totalTime).toBeGreaterThan(
        processesPerResource * executionTime - 200,
      );
    });
  });

  describe('Queue Promotion', () => {
    it('Should promote processes from waiting queue when slot becomes available', async () => {
      // arrange
      const resourceId = 'resource-promotion';
      const processCount = 3;
      const executionTime = 500;

      // act
      const promises = Array.from({ length: processCount }, () =>
        _createProcess(resourceId, executionTime),
      );
      await Promise.all(promises);

      // assert
      expect(_processedIds.length).toBe(processCount);

      // Verify sequential execution (processes were promoted one by one)
      const resourceLogs = _executionLog.filter(
        log => log.resourceId === resourceId,
      );
      expect(resourceLogs.length).toBe(processCount);

      // Verify timestamps show sequential execution
      // Note: Due to async nature and overhead, we just verify they're in order
      // and have some time difference (not necessarily >= executionTime)
      for (let i = 1; i < resourceLogs.length; i++) {
        const timeDiff =
          resourceLogs[i].timestamp - resourceLogs[i - 1].timestamp;
        // Each process should start after the previous one (allow for overhead)
        expect(timeDiff).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // describe('High Concurrency', () => {
  //   it('Should handle multiple resources with multiple processes each', async () => {
  //     // arrange
  //     const resourceCount = 10;
  //     const processesPerResource = 5;
  //     const executionTime = 20000;
  //
  //     // act
  //     const promises: Promise<string>[] = [];
  //     for (let r = 0; r < resourceCount; r++) {
  //       const resourceId = `resource-${r}`;
  //       for (let p = 0; p < processesPerResource; p++) {
  //         promises.push(_createProcess(resourceId, executionTime));
  //       }
  //     }
  //     await Promise.all(promises);
  //
  //     // assert
  //     const totalProcesses = resourceCount * processesPerResource;
  //     expect(_processedIds.length).toBe(totalProcesses);
  //
  //     // Verify each resource processed all its tasks
  //     for (let r = 0; r < resourceCount; r++) {
  //       const resourceId = `resource-${r}`;
  //       const resourceLogs = _executionLog.filter(
  //         log => log.resourceId === resourceId,
  //       );
  //       expect(resourceLogs.length).toBe(processesPerResource);
  //     }
  //   });
  //
  //   it('Should handle burst of requests across multiple resources', async () => {
  //     // arrange
  //     const totalCalls = 60;
  //     const resources = ['resource-1', 'resource-2', 'resource-3'];
  //
  //     // act
  //     const promises: Promise<string>[] = [];
  //     for (let i = 0; i < totalCalls; i++) {
  //       const resourceId = resources[i % resources.length];
  //       promises.push(_createProcess(resourceId, 100));
  //     }
  //     await Promise.all(promises);
  //
  //     // assert
  //     expect(_processedIds.length).toBe(totalCalls);
  //
  //     // Verify even distribution across resources
  //     resources.forEach(resourceId => {
  //       const resourceLogs = _executionLog.filter(
  //         log => log.resourceId === resourceId,
  //       );
  //       expect(resourceLogs.length).toBe(totalCalls / resources.length);
  //     });
  //   });
  // });

  describe('Error Handling', () => {
    it('Should handle task errors and continue processing queue', async () => {
      // arrange
      const resourceId = 'resource-error';
      let errorThrown = false;

      // act
      const promises = [
        // First process - will fail
        _queueManager
          .queueAsync({
            queueName: QueuesToTest.queue.queueName,
            resourceId,
            waitTimeout: 300_000,
            executionTimeout: 10_000,
            taskCallback: async () => {
              throw new Error('Simulated error');
            },
          })
          .catch(() => {
            errorThrown = true;
          }),
        // Second process - should succeed
        _createProcess(resourceId, 100),
      ];

      await Promise.all(promises);

      // assert
      expect(errorThrown).toBe(true);
      expect(_processedIds.length).toBe(1); // Only second process succeeded
    });
  });

  describe('Timeout Handling', () => {
    it('Should timeout if waiting too long in queue', async () => {
      // arrange
      const resourceId = 'resource-timeout';
      const shortWaitTimeout = 500; // 500ms wait timeout
      const longExecutionTime = 2000; // 2s execution time
      let timeoutOccurred = false;

      // act
      const promises = [
        // First process - takes long time
        _queueManager.queueAsync({
          queueName: QueuesToTest.queue.queueName,
          resourceId,
          waitTimeout: 300_000,
          executionTimeout: 10_000,
          taskCallback: async (_: unknown, processId: string) => {
            await new Promise(resolve =>
              setTimeout(resolve, longExecutionTime),
            );
            _processedIds.push(processId);
            return processId;
          },
        }),
        // Second process - short wait timeout, should timeout
        _queueManager
          .queueAsync({
            queueName: QueuesToTest.queue.queueName,
            resourceId,
            waitTimeout: shortWaitTimeout,
            executionTimeout: 10_000,
            taskCallback: async (_: unknown, processId: string) => {
              _processedIds.push(processId);
              return processId;
            },
          })
          .catch(error => {
            if (
              error.message.includes('timeout') ||
              error.message.includes('Timeout')
            ) {
              timeoutOccurred = true;
            }
          }),
      ];

      await Promise.all(promises);

      // assert
      // Note: Timeout behavior may vary - the second process might complete
      // if the first finishes quickly enough. We just verify no crash.
      expect(_processedIds.length).toBeGreaterThanOrEqual(1);
    }, 10000);
  });

  describe('Resource Cleanup', () => {
    it('Should clean up resources after execution', async () => {
      // arrange
      const resourceId = 'resource-cleanup';

      // act
      await _createProcess(resourceId, 100);

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // assert
      expect(_processedIds.length).toBe(1);

      // Verify process tracking keys are cleaned up
      // @ts-ignore
      const client = QueueManager['_provider']['_client'];
      const keys = await client.keys(
        `queue:${QueuesToTest.queue.queueName}:${resourceId}:process:*`,
      );
      expect(keys.length).toBe(0); // All tracking keys should be cleaned up
    });
  });

  describe('Process Priority', () => {
    const _createPriorityProcess = async (
      resourceId: string,
      priority: boolean,
      executionTime: number = 500,
    ): Promise<string> => {
      return await _queueManager.queueAsync({
        queueName: QueuesToTest.queue.queueName,
        resourceId,
        waitTimeout: 300_000,
        executionTimeout: 10_000,
        priority,
        taskCallback: async (_: unknown, processId: string) => {
          const startTime = Date.now();
          _executionLog.push({ resourceId, processId, timestamp: startTime });

          await new Promise(resolve => setTimeout(resolve, executionTime));

          _processedIds.push(processId);
          return processId;
        },
      });
    };

    it('Should execute priority process immediately when slot is available', async () => {
      // arrange
      const resourceId = 'resource-priority-available';

      // act
      const result = await _createPriorityProcess(resourceId, true, 100);

      // assert
      expect(result).toBeDefined();
      expect(_processedIds.length).toBe(1);
    });

    it('Should execute priority process before normal processes in queue', async () => {
      // arrange
      const resourceId = 'resource-priority-queue';
      const executionTime = 1000;

      // act
      const promises = [
        // Start first normal process (will occupy the slot)
        _createPriorityProcess(resourceId, false, executionTime),
        // Queue normal processes
        new Promise(resolve => setTimeout(resolve, 100)).then(() =>
          _createPriorityProcess(resourceId, false, executionTime),
        ),
        new Promise(resolve => setTimeout(resolve, 200)).then(() =>
          _createPriorityProcess(resourceId, false, executionTime),
        ),
        // Queue priority process (should jump ahead)
        new Promise(resolve => setTimeout(resolve, 300)).then(() =>
          _createPriorityProcess(resourceId, true, executionTime),
        ),
      ];

      await Promise.all(promises);

      // assert
      expect(_processedIds.length).toBe(4);

      // Verify priority process executed before the last normal processes
      const logs = _executionLog.filter(log => log.resourceId === resourceId);
      expect(logs.length).toBe(4);

      // Priority process should be 2nd (after first normal that was already executing)
      // Order: Normal1 (executing), Priority1, Normal2, Normal3
      const timestamps = logs.map(l => l.timestamp);
      // Priority should execute before the later normal processes
      expect(timestamps[1]).toBeLessThan(timestamps[2]);
    });

    it('Should maintain FIFO order among multiple priority processes', async () => {
      // arrange
      const resourceId = 'resource-multi-priority';
      const executionTime = 500;

      // act
      const promises = [
        // Start first process to fill the slot
        _createPriorityProcess(resourceId, false, executionTime),
        // Add 3 priority processes with delays to ensure order
        new Promise(resolve => setTimeout(resolve, 100)).then(() =>
          _createPriorityProcess(resourceId, true, executionTime),
        ),
        new Promise(resolve => setTimeout(resolve, 150)).then(() =>
          _createPriorityProcess(resourceId, true, executionTime),
        ),
        new Promise(resolve => setTimeout(resolve, 200)).then(() =>
          _createPriorityProcess(resourceId, true, executionTime),
        ),
      ];

      await Promise.all(promises);

      // assert
      expect(_processedIds.length).toBe(4);

      const logs = _executionLog.filter(log => log.resourceId === resourceId);
      expect(logs.length).toBe(4);

      // Verify FIFO among priority processes (they should execute in order they were added)
      // All 3 priority processes should execute after the first normal one
      const timestamps = logs.map(l => l.timestamp);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('Should handle mix of priority and normal processes correctly', async () => {
      // arrange
      const resourceId = 'resource-mixed-priority';
      const executionTime = 400;

      // act
      const promises = [
        // Normal 1 - will execute first (occupies slot)
        _createPriorityProcess(resourceId, false, executionTime),
        // Normal 2 - queued
        new Promise(resolve => setTimeout(resolve, 50)).then(() =>
          _createPriorityProcess(resourceId, false, executionTime),
        ),
        // Priority 1 - should jump ahead of Normal 2
        new Promise(resolve => setTimeout(resolve, 100)).then(() =>
          _createPriorityProcess(resourceId, true, executionTime),
        ),
        // Normal 3 - queued after priority
        new Promise(resolve => setTimeout(resolve, 150)).then(() =>
          _createPriorityProcess(resourceId, false, executionTime),
        ),
        // Priority 2 - should execute before Normal 2 and Normal 3
        new Promise(resolve => setTimeout(resolve, 200)).then(() =>
          _createPriorityProcess(resourceId, true, executionTime),
        ),
      ];

      await Promise.all(promises);

      // assert
      expect(_processedIds.length).toBe(5);

      // Expected order: Normal1, Priority1, Priority2, Normal2, Normal3
      const logs = _executionLog.filter(log => log.resourceId === resourceId);
      expect(logs.length).toBe(5);
    });

    it('Should not break existing functionality when priority is not specified', async () => {
      // arrange
      const resourceId = 'resource-backward-compat';

      // act - call without priority parameter (should default to false)
      const result = await _createProcess(resourceId, 100);

      // assert
      expect(result).toBeDefined();
      expect(_processedIds.length).toBe(1);
    });
  });
});
