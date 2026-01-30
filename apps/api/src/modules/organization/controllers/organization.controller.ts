import { Body, Controller, Get, Patch } from '@nestjs/common';
import type {
  Organization,
  OrganizationMembersResponse,
  UpdateOrganizationRequest,
} from '@repo/schema';
import { User } from 'src/modules/auth/decorators/user.decorator';
import { OrganizationService } from '../services/organization.service';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('current')
  public async getCurrent(@User('organizationId') organizationId: number): Promise<Organization> {
    const organization = await this.organizationService.getOrganization(organizationId);
    return organization.toDto();
  }

  @Patch('current')
  public async update(
    @User('organizationId') organizationId: number,
    @Body() body: UpdateOrganizationRequest,
  ): Promise<Organization> {
    const organization = await this.organizationService.update(organizationId, body);
    return organization.toDto();
  }

  @Get('current/members')
  public async getMembers(
    @User('organizationId') organizationId: number,
  ): Promise<OrganizationMembersResponse> {
    const members = await this.organizationService.getMembers(organizationId);
    return { members: members.map((m) => m.toDto()) };
  }
}
