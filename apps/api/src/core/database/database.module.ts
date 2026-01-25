import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './services/database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
