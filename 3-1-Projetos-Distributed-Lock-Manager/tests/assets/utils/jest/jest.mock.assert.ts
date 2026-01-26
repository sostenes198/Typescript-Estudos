export const assertJestMock = (
  mock: jest.Mock,
  timesToHaveBeenCalled: number,
  ...params: unknown[]
): void => {
  expect(mock).toHaveBeenCalledTimes(timesToHaveBeenCalled);
  if (timesToHaveBeenCalled > 0) {
    expect(mock).toHaveBeenCalledWith(...params);
  }
};

export const assertJestMockMultipleParams = (
  mock: jest.Mock,
  timesToHaveBeenCalled: number,
  ...multiplesParam: unknown[][]
): void => {
  expect(mock).toHaveBeenCalledTimes(timesToHaveBeenCalled);
  if (timesToHaveBeenCalled > 0) {
    multiplesParam.forEach(params => {
      expect(mock).toHaveBeenCalledWith(...params);
    });
  }
};

export const assertJestSpyInstance = (
  mock: jest.SpyInstance,
  timesToHaveBeenCalled: number,
  ...params: unknown[]
): void => {
  expect(mock).toHaveBeenCalledTimes(timesToHaveBeenCalled);
  if (timesToHaveBeenCalled > 0) {
    expect(mock).toHaveBeenCalledWith(...params);
  }
};

export const assertJestSpyInstanceMultipleParams = (
  mock: jest.SpyInstance,
  timesToHaveBeenCalled: number,
  ...multiplesParam: unknown[][]
): void => {
  expect(mock).toHaveBeenCalledTimes(timesToHaveBeenCalled);
  if (timesToHaveBeenCalled > 0) {
    multiplesParam.forEach(params => {
      expect(mock).toHaveBeenCalledWith(...params);
    });
  }
};
