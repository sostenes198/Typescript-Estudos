/* eslint-disable @typescript-eslint/no-explicit-any */
import nock from 'nock';
import { sign } from 'jsonwebtoken';

const _getParams = (scope: nock.Scope) => {
  const { interceptors } = scope as any;
  const intercept = interceptors[0];

  const body: object = intercept.req!.requestBodyBuffers[0]
    ? JSON.parse(intercept.req!.requestBodyBuffers[0])
    : {};
  const { headers } = intercept.req;


  const expectedToken: string = sign(
    {
      client_id: '123',
      user_id: '4567',
    },
    'NONE',
    { noTimestamp: true },
  );

  return { interceptors, body, headers, expectedToken };
};

const _assertBody = (
  body: object,
  bodyExpected?: object | ((body: object) => void),
): void => {
  if (!bodyExpected) {
    if (typeof bodyExpected === 'function') {
      bodyExpected(body);
    } else {
      expect(body).toStrictEqual(bodyExpected);
    }
  }
};

const _assert = (
  scope: nock.Scope,
  interceptors: any,
  headers: any,
  body: object,
  expectedToken: string,
  bodyExpected?: object | ((body: object) => void),
): void => {
  scope.done();

  expect(interceptors.length).toStrictEqual(1);

  _assertBody(body, bodyExpected);

  expect(headers['content-type']).toStrictEqual('application/json');
  expect(headers.authorization).toStrictEqual(`Bearer ${expectedToken}`);
};

export const assertNoqGraphqlRequest = (
  scope: nock.Scope,
  bodyExpected?: object | ((body: object) => void),
): void => {
  const { interceptors, body, headers, expectedToken } =
    _getParams(scope);
  _assert(
    scope,
    interceptors,
    headers,
    body,
    expectedToken,
    bodyExpected,
  );
};
