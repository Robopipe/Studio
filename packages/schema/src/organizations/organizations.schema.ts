import z from "zod";
import { OrgMemberRoleEnum, userSchema } from "../users";
import { timestampsSchema } from "../helpers";

export const organizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  ...timestampsSchema
});

export const updateOrganizationRequestSchema = z.object({
  name: z.string().min(1).max(256),
});

export enum InvitationStatusEnum {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  EXPIRED = "EXPIRED",
}

export const organizationMemberSchema = z.object({
  user: userSchema,
  role: z.nativeEnum(OrgMemberRoleEnum),
});

export const organizationMembersResponseSchema = z.object({
  members: z.array(organizationMemberSchema),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([OrgMemberRoleEnum.ADMIN, OrgMemberRoleEnum.MEMBER]),
});

export const organizationListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.nativeEnum(OrgMemberRoleEnum),
});

export const invitationSchema = z.object({
  id: z.number(),
  email: z.email(),
  organizationName: z.string(),
  status: z.nativeEnum(InvitationStatusEnum),
  expiresAt: z.string(),
  createdAt: z.string(),
});
