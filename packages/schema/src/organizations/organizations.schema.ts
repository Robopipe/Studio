import z from "zod";
import { userSchema, UserRoleEnum } from "../users";
import { timestampsSchema } from "../helpers";

export const organizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  ...timestampsSchema
});

export const updateOrganizationRequestSchema = z.object({
  name: z.string().min(1).max(256),
});

export const organizationMemberSchema = userSchema;

export const organizationMembersResponseSchema = z.object({
  members: z.array(organizationMemberSchema),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(UserRoleEnum),
});
