import nock from 'nock';
import request from 'supertest';
import { assertNoqRequest } from '../util';

describe('noq.assert.spec', () => {
  it('test', async () => {
    const nockResult = nock('http://localhost:3000')
      .get('/v1/test')
      .reply(200, { done: true });

    const result = await request('http://localhost:3000')
      .get('/v1/test')
      .send();

    expect(result.body).toStrictEqual({ done: true });

    assertNoqRequest(nockResult, (body) => {
      expect(body).toStrictEqual({});
    });
  });
});