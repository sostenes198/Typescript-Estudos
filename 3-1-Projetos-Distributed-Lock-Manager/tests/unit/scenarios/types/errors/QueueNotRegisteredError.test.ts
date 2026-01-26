import { BaseError, QueueNotRegisteredError } from '../../../../../src/types';

describe('QueueNotRegisteredError', () => {
  it('Should validate error', () => {
    // arrange - act
    const error = new QueueNotRegisteredError('queue-test', ['1', '2', '3']);

    // assert
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      `Queue "queue-test" is not registered. ` +
        `Queues must be registered during bootstrap before they can be used. ` +
        `Available queues: 1, 2, 3`,
    );
    expect(error.name).toBe(QueueNotRegisteredError.name);
    expect(error.stack).toBeDefined();

    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
  });
});
