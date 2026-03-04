import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateOrganizationRequest } from '@repo/schema';
import { UserRoleEnum } from '@repo/schema';
import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { AppConfig } from 'src/core/configuration/app.config';
import { EmailService } from 'src/modules/email/email.service';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { PasswordResetRepository } from 'src/repository/services/password-reset-repository.service';
import { OrganizationEntity } from '../entities/organization.entity';
import { OrganizationRepository } from 'src/repository/services/organization-repository.service';
import { UserRepository } from 'src/repository/services/user-repository.service';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly emailService: EmailService,
    private readonly config: AppConfig,
  ) {}

  /**
   * Get organization
   * @throws NotFoundException - Organization not found
   * @returns Organization entity
   */
  public async getOrganization(id: number): Promise<OrganizationEntity> {
    const organization = await this.organizationRepository.getById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Update organization
   * @throws NotFoundException - Organization not found
   * @returns - Organization entity
   */
  public async update(id: number, data: UpdateOrganizationRequest): Promise<OrganizationEntity> {
    const organization = await this.organizationRepository.update(id, data);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Get org members
   * @param organizationId
   * @returns User entities
   */
  public async getMembers(organizationId: number): Promise<UserEntity[]> {
    return this.userRepository.getAllByOrganizationId(organizationId);
  }

  /**
   * Invite a new user to the organization
   * @param organizationId
   * @param email
   * @param fullName
   * @throws ConflictException if user with email already exists
   */
  public async inviteUser(
    organizationId: number,
    email: string,
    fullName: string,
  ): Promise<void> {
    const existingUser = await this.userRepository.getByEmail(email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const randomPassword = randomBytes(16).toString("hex");
    const hashedPassword = await hash(randomPassword, 10);

    const user = await this.userRepository.create({
      email,
      username: email,
      fullName,
      password: hashedPassword,
      role: UserRoleEnum.MEMBER,
      organizationId,
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.passwordResetRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    const resetLink = `${this.config.webHost}/reset-password?token=${token}`;
    await this.emailService.sendInvitationEmail(email, fullName, resetLink);
  }
}
