export type AssertMock = {
  timesToHaveBeenCalled: number;
  params: unknown[];
};

export type AssertMockMultipleTimes = {
  timesToHaveBeenCalled: number;
  params: unknown[][];
};
