import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { OrganizationController } from './controllers/organization.controller';
import { OrganizationService } from './services/organization.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, RolesGuard],
  exports: [OrganizationService],
})
export class OrganizationModule {}
