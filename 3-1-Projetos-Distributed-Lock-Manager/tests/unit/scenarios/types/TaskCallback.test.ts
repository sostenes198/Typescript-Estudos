import { TaskCallback } from '../../../../src/types';

describe('TaskCallback', () => {
  it('should allow defining an error handler that returns a value', async () => {
    // arrange
    const handler: TaskCallback<string> = (
      _: AbortSignal,
      processId: string,
    ): Promise<string> => {
      return Promise.resolve(`Handled: ${processId}`);
    };

    // act
    const result = await handler(null!, '123');

    // assert
    expect(result).toBe('Handled: 123');
  });
});
