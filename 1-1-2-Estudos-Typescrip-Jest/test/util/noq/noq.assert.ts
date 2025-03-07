/* eslint-disable @typescript-eslint/no-explicit-any,no-nested-ternary,no-plusplus */
import nock from 'nock';

const _getParams = (scope: nock.Scope, index: number) => {
  const { interceptors } = scope as any;
  const intercept = interceptors[index];

  const body: object = intercept.req!
    ? intercept.req.requestBodyBuffers[0]
      ? JSON.parse(intercept.req.requestBodyBuffers[0])
      : {}
    : {};

  const headers: any = intercept.req?.headers ?? {};

  return { interceptors, body, headers };
};

const _assertBody = (
  body: object,
  bodyExpected?: object | ((body: object) => void),
): void => {
  if (bodyExpected) {
    if (typeof bodyExpected === 'function') {
      bodyExpected(body);
    } else {
      expect(body).toStrictEqual(bodyExpected);
    }
  }
};

const _assertHeaders = (
  headers: any,
  headersExpected?: object | ((headers: any) => void),
): void => {
  if (headersExpected) {
    if (typeof headersExpected === 'function') {
      headersExpected(headers);
    } else {
      expect(headers).toStrictEqual(headersExpected);
    }
  }
};

const _assert = (
  scope: nock.Scope,
  interceptors: any,
  interceptorsLength: number,
  headers: any,
  body: object,
  bodyExpected?: object | ((body: object) => void),
  headersExpected?: object | ((headers: any) => void),
): void => {
  scope.done();

  expect(interceptors.length).toStrictEqual(interceptorsLength);

  _assertBody(body, bodyExpected);
  _assertHeaders(headers, headersExpected);
};

export const assertNoqRequest = (
  scope: nock.Scope,
  bodyExpected?: object | ((body: object) => void),
  headersExpected?: object | ((headers: any) => void),
): void => {
  const { interceptors, body, headers } = _getParams(scope, 0);
  _assert(scope, interceptors, 1, headers, body, bodyExpected, headersExpected);
};

export const assertNoqMultiplesRequest = (
  scope: nock.Scope,
  lengthCalledRequests: number,
  multiplesExpected?: {
    bodyExpected?: object | ((body: object) => void);
    headersExpected?: object | ((headers: any) => void);
  }[],
): void => {
  for (let i = 0; i < lengthCalledRequests; i++) {
    const { interceptors, body, headers } = _getParams(scope, i);
    let bodyExpected;
    let headersExpected;
    if (multiplesExpected && multiplesExpected[i]) {
      bodyExpected = multiplesExpected[i].bodyExpected;
      headersExpected = multiplesExpected[i].headersExpected;
    }
    _assert(
      scope,
      interceptors,
      lengthCalledRequests,
      headers,
      body,
      bodyExpected,
      headersExpected,
    );
  }
};
