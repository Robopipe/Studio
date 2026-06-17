import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, isNull } from "drizzle-orm";
import { emailVerificationTable } from "@repo/database";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import type {
  EmailVerificationInsert,
  EmailVerificationSelect,
} from "../types/email-verification";

@Injectable()
export class EmailVerificationRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Create an email verification token
   * @param data
   * @returns created verification record
   */
  async create(data: EmailVerificationInsert): Promise<EmailVerificationSelect> {
    const [record] = await this.db
      .insert(emailVerificationTable)
      .values(data)
      .returning();
    return record;
  }

  /**
   * Find an unused, non-expired token
   * @param token
   * @returns verification record or null
   */
  async findValidToken(token: string): Promise<EmailVerificationSelect | null> {
    const [result] = await this.db
      .select()
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.token, token),
          isNull(emailVerificationTable.usedAt),
          gt(emailVerificationTable.expiresAt, new Date()),
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
      .update(emailVerificationTable)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTable.id, id));
  }

  /**
   * Delete all verification tokens for a user
   * @param userId
   */
  async deleteByUserId(userId: number): Promise<void> {
    await this.db
      .delete(emailVerificationTable)
      .where(eq(emailVerificationTable.userId, userId));
  }
}
