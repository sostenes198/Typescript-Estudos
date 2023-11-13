import BaseTest from '@test/integration/BaseTest';

afterEach(async () => {
    await BaseTest.Dispose();
});

beforeEach(async () => {
    await BaseTest.Start();
});
