import { DynamicModule, Module } from '@nestjs/common';
import { EnvConfigService } from './env-config.service';
import { ConfigModule, ConfigModuleOptions } from '@nestjs/config';
import { join } from 'node:path';

@Module({
  providers: [EnvConfigService]
})
export class EnvConfigModule extends ConfigModule {

  private static readonly path: string = join(__dirname, `../../../../.env.${process.env.NODE_ENV}`);

  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    return super.forRoot({
      ...options,
      envFilePath: this.path
    });
  }
}
