import '../../../assets';
import {
  ProviderType,
  StorageConfig,
  StorageConfigValKey,
  StorageConfigValKeyConnectionDetails,
} from '../../../../src/types';

describe('StorageConfig', () => {
  describe('StorageConfigValKey', () => {
    const _assertStorageConfig = function (
      StorageConfig: StorageConfigValKey,
      providerType: ProviderType.VALKEY,
      connectionDetails: StorageConfigValKeyConnectionDetails,
    ): void {
      expect(StorageConfig).toStrictEqual({
        providerType,
        connectionDetails,
      });
    };

    const _assertPropertiesStorageConfig = function (
      StorageConfig: StorageConfig,
    ): void {
      expect(StorageConfig).assertProperties([
        { propertyName: 'providerType', typeProperty: 'string' },
        { propertyName: 'connectionDetails', typeProperty: 'object' },
      ]);
    };

    it('Should validate type StorageConfig', () => {
      // arrange - act
      const StorageConfig: StorageConfigValKey = {
        providerType: ProviderType.VALKEY,
        connectionDetails: {},
      };

      // assert
      _assertStorageConfig(
        StorageConfig,
        StorageConfig.providerType,
        StorageConfig.connectionDetails,
      );
      _assertPropertiesStorageConfig(StorageConfig);
    });
  });
});
