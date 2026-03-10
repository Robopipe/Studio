import z from "zod";
import { OrgMemberRoleEnum, userSchema } from "../users";
import { organizationSchema } from "../organizations";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().nonempty(),
});

export const preAuthTokenSchema = z.object({
  accessToken: z.string().nonempty(),
  user: userSchema,
});

export const tokenSchema = z.object({
  accessToken: z.string().nonempty(),
  user: userSchema,
  organization: organizationSchema,
  role: z.nativeEnum(OrgMemberRoleEnum),
});

export const preAuthJwtSchema = z.object({
  sub: z.int(),
  scope: z.literal("pre-auth"),
  iat: z.int(),
  exp: z.int(),
});

export const sessionJwtSchema = z.object({
  sub: z.int(),
  orgId: z.int(),
  role: z.nativeEnum(OrgMemberRoleEnum),
  scope: z.literal("session"),
  iat: z.int(),
  exp: z.int(),
});

export const jwtSchema = sessionJwtSchema;

export const selectOrganizationSchema = z.object({
  organizationId: z.number(),
});

export const registerSchema = z.object({
  email: z.email(),
  fullName: z.string().nonempty(),
});

export const updateUserSchema = z.object({
  fullName: z.string().nonempty(),
  cameraApiUrl: z.url(),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().nonempty(),
  password: z.string().min(8),
});

export const inviteUserSchema = z.object({
  email: z.email(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(256),
});
