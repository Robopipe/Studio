import type { User } from '@repo/schema';
import { UserRoleEnum } from '@repo/schema';
import type { UserSelect } from 'src/repository/types/user';

export class UserEntity {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly cameraApiUrl: string;
  readonly organizationId: number;
  readonly role: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: UserSelect) {
    Object.assign(this, data);
  }

  isAdmin(): boolean {
    return this.role === UserRoleEnum.ADMIN;
  }

  toDto(): User {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      organizationId: this.organizationId,
      cameraApiUrl: this.cameraApiUrl,
      role: this.role as UserRoleEnum,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
