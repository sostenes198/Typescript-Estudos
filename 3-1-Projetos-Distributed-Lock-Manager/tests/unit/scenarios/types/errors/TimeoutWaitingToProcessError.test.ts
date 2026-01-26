import {
  BaseError,
  TimeoutWaitingToProcessError,
} from '../../../../../src/types';

describe('TimeoutWaitingToProcessError', () => {
  it('Should validate error', () => {
    // arrange - act
    const error = new TimeoutWaitingToProcessError('queue-test', 100);

    // assert
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      `Timeout waiting to process task in queue "queue-test". ` +
        `Wait timeout of 100ms expired.`,
    );
    expect(error.name).toBe(TimeoutWaitingToProcessError.name);
    expect(error.stack).toBeDefined();

    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
  });
});
