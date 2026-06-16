import z from "zod";
import {
  assignableRoleEnum,
  invitationSchema,
  organizationListItemSchema,
  organizationMemberSchema,
  organizationMembersResponseSchema,
  organizationSchema,
  updateMemberRoleSchema,
  updateOrganizationRequestSchema,
} from "./organizations.schema";

export type Organization = z.infer<typeof organizationSchema>;
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationRequestSchema>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
export type OrganizationMembersResponse = z.infer<typeof organizationMembersResponseSchema>;
export type UpdateMemberRole = z.infer<typeof updateMemberRoleSchema>;
export type OrganizationListItem = z.infer<typeof organizationListItemSchema>;
export type Invitation = z.infer<typeof invitationSchema>;
export type AssignableRole = z.infer<typeof assignableRoleEnum>;
