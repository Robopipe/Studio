import z from "zod";
import {
  organizationSchema,
  updateOrganizationRequestSchema,
  organizationMembersResponseSchema,
} from "./organizations.schema";

export type Organization = z.infer<typeof organizationSchema>;
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationRequestSchema>;
export type OrganizationMembersResponse = z.infer<typeof organizationMembersResponseSchema>;
