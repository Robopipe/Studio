import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigurationCoreModule } from './configuration-core.module';

import { AppConfig } from './app.config';
import { ConfigLoader } from './config-loader';
@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConfigurationCoreModule.forRootAsync({
      load: ConfigLoader.getConfig(),
      schema: AppConfig,
    }),
  ],
  exports: [ConfigurationCoreModule],
})
export class ConfigurationModule {}
