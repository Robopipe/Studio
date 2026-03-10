import type { User } from '@repo/schema';
import type { UserSelect } from 'src/repository/types/user';

export class UserEntity {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly cameraApiUrl: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: UserSelect) {
    Object.assign(this, data);
  }

  /**
   * @returns API response shape with dates serialized as ISO strings
   */
  toDto(): User {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      cameraApiUrl: this.cameraApiUrl,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
