import { OrgMemberRoleEnum, Organization, User } from "@repo/schema";

export interface AuthState {
  isAuthenticated: boolean | null;
  isPreAuth: boolean;
  user: User | null;
  organization: Organization | null;
  role: OrgMemberRoleEnum | null;
}
