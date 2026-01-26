export const jestFnMockImplementationDefault = (): jest.Mock => {
  return jest.fn().mockImplementation(() => {
    throw new Error('Not Implemented');
  });
};
