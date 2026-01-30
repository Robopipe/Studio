import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateOrganizationRequest } from '@repo/schema';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { OrganizationEntity } from '../entities/organization.entity';
import { OrganizationRepository } from 'src/repository/services/organization-repository.service';
import { UserRepository } from 'src/repository/services/user-repository.service';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Get organization
   * @throws NotFoundException - Organization not foudn
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
   * Get org membrs
   * @param organizationId
   * @returns User entities
   */
  public async getMembers(organizationId: number): Promise<UserEntity[]> {
    return this.userRepository.getAllByOrganizationId(organizationId);
  }
}
