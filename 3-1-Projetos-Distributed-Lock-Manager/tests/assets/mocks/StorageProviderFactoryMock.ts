import { testUtil } from '../../assets';
import * as MockApply from '../../../src/internal/storage-providers/StorageProviderFactory';

export interface MockStorageProviderFactory {
  create: jest.Mock;
}

export class StorageProviderFactoryMock {
  public static mock(): testUtil.jest.JestMockedObj<MockStorageProviderFactory> {
    const mocked: testUtil.jest.JestMockedObj<MockStorageProviderFactory> = {
      create: testUtil.jest.jestFnMockImplementationDefault(),
    };

    jest
      .spyOn(MockApply.StorageProviderFactory, 'create')
      .mockImplementation(mocked.create);

    return mocked;
  }
}
