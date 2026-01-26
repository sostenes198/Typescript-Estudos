import { BaseError, HeartbeatTimeoutError } from '../../../../../src/types';

describe('HeartbeatTimeoutError', () => {
  it('Should validate error', () => {
    // arrange - act
    const error = new HeartbeatTimeoutError('queue-test', 'process-id');

    // assert
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      `Heartbeat timeout for process "process-id" in queue "queue-test". ` +
        `The heartbeat update failed or the event loop is blocked.`,
    );
    expect(error.name).toBe(HeartbeatTimeoutError.name);
    expect(error.stack).toBeDefined();

    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
  });
});
