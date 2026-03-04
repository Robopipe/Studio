import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { InviteUserDto } from 'src/modules/auth/dto/auth.dto';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard';
import { User } from 'src/modules/auth/decorators/user.decorator';
import { OrganizationService } from '../services/organization.service';
import {
  OrganizationResponse,
  OrganizationUpdateRequest,
  OrganizationMembersResponse,
  UpdateMemberRoleDto,
} from "../dto/organization.dto";

@Controller("organizations")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get("current")
  public async getCurrent(
    @User("organizationId") organizationId: number,
  ): Promise<OrganizationResponse> {
    const organization =
      await this.organizationService.getOrganization(organizationId);
    return organization.toDto();
  }

  @Patch("current")
  public async update(
    @User("organizationId") organizationId: number,
    @Body() body: OrganizationUpdateRequest,
  ): Promise<OrganizationResponse> {
    const organization = await this.organizationService.update(
      organizationId,
      body,
    );
    return organization.toDto();
  }

  @Get("current/members")
  public async getMembers(
    @User("organizationId") organizationId: number,
  ): Promise<OrganizationMembersResponse> {
    const members = await this.organizationService.getMembers(organizationId);
    return { members: members.map((m) => m.toDto()) };
  }

  @Post("current/invite")
  @UseGuards(AdminGuard)
  public async inviteUser(
    @User("organizationId") organizationId: number,
    @Body() body: InviteUserDto,
  ): Promise<{ message: string }> {
    await this.organizationService.inviteUser(
      organizationId,
      body.email,
      body.fullName,
    );
    return { message: "Invitation sent successfully." };
  }

  @Delete("current/members/:userId")
  @UseGuards(AdminGuard)
  public async removeMember(
    @User("organizationId") organizationId: number,
    @Param("userId", ParseIntPipe) userId: number,
  ): Promise<{ message: string }> {
    await this.organizationService.removeMember(organizationId, userId);
    return { message: "Member removed." };
  }

  @Patch("current/members/:userId/role")
  @UseGuards(AdminGuard)
  public async updateMemberRole(
    @User("organizationId") organizationId: number,
    @Param("userId", ParseIntPipe) userId: number,
    @Body() body: UpdateMemberRoleDto,
  ): Promise<{ message: string }> {
    await this.organizationService.updateMemberRole(organizationId, userId, body.role);
    return { message: "Role updated." };
  }
}
