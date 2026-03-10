import { invitationTable } from "@repo/database";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type InvitationSelect = InferSelectModel<typeof invitationTable> & {
  organizationName?: string;
};
export type InvitationInsert = InferInsertModel<typeof invitationTable>;
