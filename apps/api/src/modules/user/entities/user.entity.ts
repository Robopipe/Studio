import type { User } from '@repo/schema';
import type { UserSelect } from 'src/repository/types/user';

export class UserEntity {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly organizationId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: UserSelect) {
    Object.assign(this, data);
  }

  toDto(): User {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      organizationId: this.organizationId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
