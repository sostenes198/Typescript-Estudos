import { BaseError } from '../../../../../../src/types';

class TestError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

describe('BaseError', () => {
  it('should create an instance of BaseError with the correct message and name', () => {
    // arrange
    const message = 'Test error message';

    // act
    const error = new TestError(message);

    // assert
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(message);
    expect(error.name).toBe(TestError.name);
    expect(error.stack).toBeDefined();
  });
});
