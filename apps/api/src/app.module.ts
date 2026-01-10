import { Module } from '@nestjs/common';
import { ConfigurationModule } from './core/configuration/configuration.module';

@Module({
  imports: [ConfigurationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
