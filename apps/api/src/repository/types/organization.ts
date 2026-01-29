import { organizationTable } from "@repo/database";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type OrganizationSelect = InferSelectModel<typeof organizationTable>;
export type OrganizationInsert = InferInsertModel<typeof organizationTable>;
export type OrganizationUpdate = Partial<Pick<OrganizationInsert, 'name'>>
