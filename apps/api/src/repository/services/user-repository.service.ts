import { Inject, Injectable } from '@nestjs/common';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { UserEntity } from 'src/modules/user/entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get user by id
   * @param id
   * @returns User Entity or null if not found
   */
  public async getById(id: number): Promise<UserEntity | null> {
    const user = await this.db.query.userTable.findFirst({
      where: { id },
      columns: { password: false },
    });

    return user ? new UserEntity(user) : null;
  }

  /**
   * Get all users by organization id
   * @param organizationId
   * @returns User entities
   */
  public async getAllByOrganizationId(organizationId: number): Promise<UserEntity[]> {
    const users = await this.db.query.userTable.findMany({
      where: { organizationId },
      columns: { password: false },
    });

    return users.map((u) => new UserEntity(u));
  }
}
