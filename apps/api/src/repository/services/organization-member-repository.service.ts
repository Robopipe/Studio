import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { organizationMemberTable } from '@repo/database';
import type { OrgMemberRoleEnum } from '@repo/schema';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { OrganizationMemberEntity } from 'src/modules/organization/entities/organization-member.entity';
import type { OrganizationMemberInsert } from '../types/organization-member';

@Injectable()
export class OrganizationMemberRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * @param userId - user ID
   * @param organizationId - organization ID
   * @returns the membership, or null if not found
   */
  public async getByUserAndOrg(userId: number, organizationId: number): Promise<OrganizationMemberEntity | null> {
    const row = await this.db.query.organizationMemberTable.findFirst({
      where: and(
        eq(organizationMemberTable.userId, userId),
        eq(organizationMemberTable.organizationId, organizationId),
      ),
    });

    return row ? new OrganizationMemberEntity(row) : null;
  }

  /**
   * @param userId - user ID
   * @returns all memberships for the user with organization data loaded
   */
  public async getAllByUserId(userId: number): Promise<OrganizationMemberEntity[]> {
    const rows = await this.db.query.organizationMemberTable.findMany({
      where: eq(organizationMemberTable.userId, userId),
      with: { organization: true },
    });

    return rows.map((r) => new OrganizationMemberEntity(r));
  }

  /**
   * @param organizationId - organization ID
   * @returns all members with their user data loaded
   */
  public async getAllByOrgId(organizationId: number): Promise<OrganizationMemberEntity[]> {
    const rows = await this.db.query.organizationMemberTable.findMany({
      where: eq(organizationMemberTable.organizationId, organizationId),
      with: { user: { columns: { password: false } } },
    });

    return rows.map((r) => new OrganizationMemberEntity(r));
  }

  /**
   * @param data - membership fields (userId, organizationId, role)
   * @returns the created membership
   * @throws {InternalServerErrorException} if the insert fails
   */
  public async create(data: OrganizationMemberInsert): Promise<OrganizationMemberEntity> {
    const [row] = await this.db.insert(organizationMemberTable).values(data).returning();

    if (!row) {
      throw new InternalServerErrorException('Failed creating organization membership');
    }

    return new OrganizationMemberEntity(row);
  }

  /**
   * @param userId - user to remove
   * @param organizationId - organization to remove from
   */
  public async remove(userId: number, organizationId: number): Promise<void> {
    await this.db
      .delete(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.userId, userId),
          eq(organizationMemberTable.organizationId, organizationId),
        ),
      );
  }

  /**
   * @param userId - target user
   * @param organizationId - organization context
   * @param role - new role to assign
   */
  public async updateRole(userId: number, organizationId: number, role: OrgMemberRoleEnum): Promise<void> {
    await this.db
      .update(organizationMemberTable)
      .set({ role })
      .where(
        and(
          eq(organizationMemberTable.userId, userId),
          eq(organizationMemberTable.organizationId, organizationId),
        ),
      );
  }
}
