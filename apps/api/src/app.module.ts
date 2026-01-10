import { Module } from '@nestjs/common';
import { ConfigurationModule } from './modules/configuration/configuration.module';

@Module({
  imports: [ConfigurationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
