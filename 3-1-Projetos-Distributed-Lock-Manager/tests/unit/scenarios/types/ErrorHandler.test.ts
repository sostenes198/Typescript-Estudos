import { ErrorHandler } from '../../../../src/types';

describe('ErrorHandler', () => {
  it('should allow defining an error handler that returns a value', () => {
    // arrange
    const handler: ErrorHandler<string> = (error: Error) => {
      return `Handled: ${error.message}`;
    };

    const error = new Error('Test error');

    // act
    const result = handler(error);

    // assert
    expect(result).toBe('Handled: Test error');
  });

  it('should allow defining an error handler that returns a promise', async () => {
    // arrange
    const handler: ErrorHandler<string> = async (error: Error) => {
      return Promise.resolve(`Handled async: ${error.message}`);
    };

    const error = new Error('Test error');

    // act
    const result = await handler(error);

    // assert
    expect(result).toBe('Handled async: Test error');
  });
});
