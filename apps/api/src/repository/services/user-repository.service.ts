import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { UserInsert, UserUpdate } from "../types/user";
import { userTable } from "@repo/database";
import { eq } from 'drizzle-orm';

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
   * Get user by email
   * @param email
   * @returns User entity or null if not found
   */
  public async getByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.db.query.userTable.findFirst({
      where: { email },
      columns: { password: false },
    });

    return user ? new UserEntity(user) : null;
  }

  /**
   * Create user
   * @param user - UserInsert
   * @throws InternalServerErrorException - Failed creating user
   * @returns created user
   */
  public async create(user: UserInsert): Promise<UserEntity> {
    const [createdUser] = await this.db.insert(userTable).values(user).returning()

    if(!createdUser){
      throw new InternalServerErrorException("Failed creating user")
    }

    return new UserEntity(createdUser)
  }

  /**
   * Update user password
   * @param id
   * @param hashedPassword - bcrypt hashed password
   */
  public async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.db
      .update(userTable)
      .set({ password: hashedPassword })
      .where(eq(userTable.id, id));
  }

  /**
   * Update user
   * @param id
   * @param data - UserUpdate
   * @throws InternalServerErrorException - Failed updating user
   * @returns updated user
   */
  public async update(id: number, data: UserUpdate): Promise<UserEntity> {
    const [updatedUser] = await this.db
      .update(userTable)
      .set(data)
      .where(eq(userTable.id, id))
      .returning()

    if(!updatedUser){
      throw new InternalServerErrorException("Failed updating user")
    }

    return new UserEntity(updatedUser)
  }
}
