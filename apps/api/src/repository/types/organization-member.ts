import { organizationMemberTable } from "@repo/database";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { OrganizationSelect } from "./organization";
import { UserSelect } from "./user";

export type OrganizationMemberSelect = InferSelectModel<typeof organizationMemberTable> & {
  user?: UserSelect;
  organization?: OrganizationSelect;
};
export type OrganizationMemberInsert = InferInsertModel<typeof organizationMemberTable>;
