export const assertJestMock = function assertMock(
  mock: jest.Mock,
  timesToHaveBeenCalled: number,
  ...params: unknown[]
): void {
  expect(mock).toHaveBeenCalledTimes(timesToHaveBeenCalled);
  if (timesToHaveBeenCalled > 0) {
    expect(mock).toHaveBeenCalledWith(...params);
  }
};

export const assertJestSpyInstance = function assertMock(
  mock: jest.SpyInstance,
  timesToHaveBeenCalled: number,
  ...params: unknown[]
): void {
  expect(mock).toHaveBeenCalledTimes(timesToHaveBeenCalled);
  if (timesToHaveBeenCalled > 0) {
    expect(mock).toHaveBeenCalledWith(...params);
  }
};
