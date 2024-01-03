import { ErrorTimeout } from "./error.timeout";
import { ErrorInputNull } from "./error.input.null";
import { TsDataType } from "./ts.data.type";
import { ErrorInputInvalid } from "./error.input.invalid";

const _ms: number = 1000;

const isNullUndefinedOrEmpty = function (obj: TsDataType): boolean {
  if (obj === null) return true;

  switch (typeof obj) {
    case 'string':
      return obj === '';
    case 'number':
      return obj === 0;
    case 'boolean':
      return !obj;
    case 'symbol':
      return obj.description === '';
    case 'object':
      return Object.keys(obj).length === 0;
    default:
      return true;
  }
};

const _configureTimeout = (
  timeoutInSeconds: number,
  reject: (reason: unknown) => void,
): NodeJS.Timeout => {
  return setTimeout(() => {
    reject(new ErrorTimeout());
  }, _ms * timeoutInSeconds);
};

const _handler = async <TInput, TResult>(
  input: TInput,
  validatorInputFunc: (input: TInput) => boolean,
  execution: (
    input: TInput,
  ) => Promise<TResult>,
): Promise<TResult> => {
  if (isNullUndefinedOrEmpty(input)) {
    throw new ErrorInputNull();
  }

  if(!validatorInputFunc(input))
    throw new ErrorInputInvalid();

  return execution(input);
};

export const serviceHandlerExecution = async <TInput, TResult>(
  input: TInput,
  validatorInputFunc: (input: TInput) => boolean,
  execution: (
    input: TInput,
  ) => Promise<TResult>,
  timeoutInSeconds: number,
): Promise<TResult> => {
  return new Promise((resolve, reject) => {
    const timeout: NodeJS.Timeout = _configureTimeout(timeoutInSeconds, reject);
    _handler<TInput, TResult>(
      input,
      validatorInputFunc,
      execution,
    )
      .then((result: TResult): void => {
        resolve(result);
      })
      .catch((error: Error): void => {
        reject(error);
      })
      .finally(() => {
        clearTimeout(timeout);
      });
  });
};
