import { ProviderType } from './enums';
import { RedisOptions } from 'iovalkey';

export type StorageConfigValKeyConnectionDetails = RedisOptions;

export type StorageConfigValKey = {
  providerType: ProviderType.VALKEY;
  connectionDetails: StorageConfigValKeyConnectionDetails;
};

export type StorageConfig = StorageConfigValKey;
