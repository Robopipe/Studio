import { SetMetadata } from "@nestjs/common";
import type { OrgMemberRoleEnum } from "@repo/schema";
import { ROLES_KEY } from "../guards/roles.guard";

export const Roles = (...roles: OrgMemberRoleEnum[]) =>
  SetMetadata(ROLES_KEY, roles);
