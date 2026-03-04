import { Inject, Injectable } from "@nestjs/common";
import { eq, and, isNull, gt } from "drizzle-orm";
import { passwordResetTable } from "@repo/database";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import type {
  PasswordResetInsert,
  PasswordResetSelect,
} from "../types/password-reset";

@Injectable()
export class PasswordResetRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Create a password reset token
   * @param data
   * @returns created reset record
   */
  async create(data: PasswordResetInsert): Promise<PasswordResetSelect> {
    const [reset] = await this.db
      .insert(passwordResetTable)
      .values(data)
      .returning();
    return reset;
  }

  /**
   * Find an unused, non-expired token
   * @param token
   * @returns reset record or null
   */
  async findValidToken(token: string): Promise<PasswordResetSelect | null> {
    const [result] = await this.db
      .select()
      .from(passwordResetTable)
      .where(
        and(
          eq(passwordResetTable.token, token),
          isNull(passwordResetTable.usedAt),
          gt(passwordResetTable.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return result ?? null;
  }

  /**
   * Mark a token as used
   * @param id
   */
  async markUsed(id: number): Promise<void> {
    await this.db
      .update(passwordResetTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTable.id, id));
  }

  /**
   * Delete all reset tokens for a user
   * @param userId
   */
  async deleteByUserId(userId: number): Promise<void> {
    await this.db
      .delete(passwordResetTable)
      .where(eq(passwordResetTable.userId, userId));
  }
}
