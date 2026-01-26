/* eslint-disable @typescript-eslint/no-explicit-any */
import nock from 'nock';

const _getParams = (scope: nock.Scope, index: number) => {
  const { interceptors } = scope as any;
  const intercept = interceptors[index];

  const headers: any = intercept.req?.headers ?? {};

  const contentType = headers['content-type'] || '';

  let body: any;

  if (contentType === 'application/x-www-form-urlencoded') {
    const raw = intercept.req?.requestBodyBuffers?.[0]?.toString() || '';
    const parsed = new URLSearchParams(raw);
    body = {};
    for (const [key, value] of parsed.entries()) {
      body[key] = value;
    }
  } else {
    body = intercept.req
      ? intercept.req.requestBodyBuffers?.length > 0 &&
        intercept.req.requestBodyBuffers[0].toString()
        ? JSON.parse(intercept.req.requestBodyBuffers[0])
        : {}
      : {};
  }

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
