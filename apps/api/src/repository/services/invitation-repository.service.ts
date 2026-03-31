import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { invitationTable } from '@repo/database/schema';
import { InvitationStatusEnum } from '@repo/schema';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { InvitationEntity } from 'src/modules/organization/entities/invitation.entity';
import type { InvitationInsert } from '../types/invitation';

@Injectable()
export class InvitationRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * @param data - invitation fields (email, organizationId, invitedById, token, expiresAt)
   * @returns the created invitation
   * @throws {InternalServerErrorException} if the insert fails
   */
  public async create(data: InvitationInsert): Promise<InvitationEntity> {
    const [row] = await this.db.insert(invitationTable).values(data).returning();

    if (!row) {
      throw new InternalServerErrorException('Failed creating invitation');
    }

    return new InvitationEntity(row);
  }

  /**
   * @param token - unique invitation token
   * @returns the invitation, or null if not found
   */
  public async findByToken(token: string): Promise<InvitationEntity | null> {
    const row = await this.db.query.invitationTable.findFirst({
      where: { token },
    });

    return row ? new InvitationEntity(row) : null;
  }

  /**
   * @param id - invitation ID
   * @returns the invitation, or null if not found
   */
  public async findById(id: number): Promise<InvitationEntity | null> {
    const row = await this.db.query.invitationTable.findFirst({
      where: { id },
    });

    return row ? new InvitationEntity(row) : null;
  }

  /**
   * Returns pending, non-expired invitations with the organization relation loaded.
   * @param email - recipient email address
   * @returns matching invitations with organizationName populated
   */
  public async findPendingByEmail(email: string): Promise<InvitationEntity[]> {
    const rows = await this.db.query.invitationTable.findMany({
      where: {
        email,
        status: InvitationStatusEnum.PENDING,
        expiresAt: { gt: new Date() },
      },
      with: { organization: true },
    });

    return rows.map((r) => {
      const entity = new InvitationEntity(r);
      if ((r as any).organization?.name) {
        (entity as any).organizationName = (r as any).organization.name;
      }
      return entity;
    });
  }

  /**
   * Returns pending, non-expired invitations for the given organization.
   * @param organizationId - organization ID
   * @returns matching invitations
   */
  public async findPendingByOrganizationId(organizationId: number): Promise<InvitationEntity[]> {
    const rows = await this.db.query.invitationTable.findMany({
      where: {
        organizationId,
        status: InvitationStatusEnum.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    return rows.map((r) => new InvitationEntity(r));
  }

  /**
   * @param id - invitation ID
   * @param status - new status to set
   */
  public async updateStatus(id: number, status: InvitationStatusEnum): Promise<void> {
    await this.db
      .update(invitationTable)
      .set({ status })
      .where(eq(invitationTable.id, id));
  }
}
