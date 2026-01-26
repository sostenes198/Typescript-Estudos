import { BaseError, MaxExecutionTimeoutError } from '../../../../../src/types';

describe('MaxExecutionTimeoutError', () => {
  it('Should validate error', () => {
    // arrange - act
    const error = new MaxExecutionTimeoutError('queue-test', 100);

    // assert
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      `Maximum execution timeout reached for queue "queue-test". ` +
        `Execution timeout of 100ms expired.`,
    );
    expect(error.name).toBe(MaxExecutionTimeoutError.name);
    expect(error.stack).toBeDefined();

    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
  });
});
