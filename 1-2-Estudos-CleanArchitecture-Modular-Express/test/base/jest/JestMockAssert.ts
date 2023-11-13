export class JestMockAssert {
    public static AssertMock(mock: jest.Mock, timesToHaveBeenCalled: number, ...params: unknown[]): void {
        expect(mock).toHaveBeenCalledTimes(timesToHaveBeenCalled);
        if (timesToHaveBeenCalled > 0) {
            expect(mock).toHaveBeenCalledWith(...params);
        }
    }
    public static AssertJestSpyInstance(mock: jest.SpyInstance, timesToHaveBeenCalled: number, ...params: unknown[]): void {
        expect(mock).toHaveBeenCalledTimes(timesToHaveBeenCalled);
        if (timesToHaveBeenCalled > 0) {
            expect(mock).toHaveBeenCalledWith(...params);
        }
    }
}
