import '../../../assets';
import { Logger } from '../../../../src/types';

describe('Logger', () => {
  const _assertLogger = function (
    Logger: Logger,
    info: (message: string, ...meta: unknown[]) => void,
    error: (message: string, ...meta: unknown[]) => void,
  ): void {
    expect(Logger).toStrictEqual({
      info,
      error,
    });
  };

  const _assertPropertiesLogger = function (Logger: Logger): void {
    expect(Logger).assertProperties([
      { propertyName: 'info', typeProperty: 'function' },
      { propertyName: 'error', typeProperty: 'function' },
    ]);
  };

  it('Should validate type Logger', () => {
    // arrange - act
    const Logger: Logger = {
      info: () => {},
      error: () => {},
    };

    // assert
    _assertLogger(Logger, Logger.info, Logger.error);
    _assertPropertiesLogger(Logger);
  });
});
