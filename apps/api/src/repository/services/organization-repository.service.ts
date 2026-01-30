import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { organizationTable } from '@repo/database/schema';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { OrganizationEntity } from 'src/modules/organization/entities/organization.entity';
import type { OrganizationUpdate } from '../types/organization';

@Injectable()
export class OrganizationRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get org by id
   * @param id
   * @returns OrganizationEntity or nll if not found
   */
  public async getById(id: number): Promise<OrganizationEntity | null> {
    const organization = await this.db.query.organizationTable.findFirst({
      where: { id },
    });

    return organization ? new OrganizationEntity(organization) : null;
  }

  /**
   * Update org
   * @param id
   * @param data - Organization Update
   * @throws InternalServerErrorException - Failed to update organization
   * @returns OrganizationEntity or null it not found
   */
  public async update(id: number, data: OrganizationUpdate): Promise<OrganizationEntity> {
    const [updated] = await this.db
      .update(organizationTable)
      .set(data)
      .where(eq(organizationTable.id, id))
      .returning();

    if(!updated){
      throw new InternalServerErrorException("Failed to update organization")
    }

    return new OrganizationEntity(updated)
  }
}
