import { Injectable } from '@nestjs/common';
import { EnvConfig } from './env-config.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfigService implements EnvConfig {

    private readonly configService: ConfigService;

    constructor(configService: ConfigService) {
        this.configService = configService;
    }

    getAppPort(): number {
        return Number(this.configService.get<number>('PORT', 0));
    }
    getNodeEnv(): string {
        return this.configService.get<string>('NODE_ENV', '');
    }

}
