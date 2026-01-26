import { Bootstrap, types } from '../../src';
import { QueuesToTest } from './assets';

beforeAll(async () => {
  await Bootstrap.initialize({
    serviceName: 'test-service',
    storageConfig: {
      providerType: types.ProviderType.VALKEY,
      connectionDetails: {
        host: 'localhost',
        port: 6379,
      },
    },
    logger: {
      info: () => {},
      error: () => {},
    },
    queueManagerConfig: {
      queueRegistration: [QueuesToTest.queue],
    },
  });
});

afterAll(async () => {
  await Bootstrap.closeAsync();
});
