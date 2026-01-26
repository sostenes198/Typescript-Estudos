import { StorageProvider } from '../abstractions';
import { Logger, ProviderType, StorageConfig } from '../../types';
import { ValKeyStorageProvider } from './providers';

export class StorageProviderFactory {
  public static create(
    storageConfig: StorageConfig,
    logger: Logger,
    serviceName: string,
  ): StorageProvider {
    switch (storageConfig.providerType) {
      case ProviderType.VALKEY:
        return new ValKeyStorageProvider(
          storageConfig.connectionDetails,
          logger,
          serviceName,
        );
      default:
        throw new Error(
          `Unsupported provider type: ${storageConfig.providerType}`,
        );
    }
  }
}
