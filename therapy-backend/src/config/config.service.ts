import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config.interface';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<AppConfig>) {}

  get database(): AppConfig['database'] {
    return this.configService.get('database', { infer: true })!;
  }

  get openai(): AppConfig['openai'] {
    return this.configService.get('openai', { infer: true })!;
  }

  get server(): AppConfig['server'] {
    return this.configService.get('server', { infer: true })!;
  }

  get fileUpload(): AppConfig['fileUpload'] {
    return this.configService.get('fileUpload', { infer: true })!;
  }

  get cors(): AppConfig['cors'] {
    return this.configService.get('cors', { infer: true })!;
  }
}
