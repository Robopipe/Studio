import z from "zod";
import {
  createOrganizationSchema,
  forgotPasswordSchema,
  inviteUserSchema,
  loginSchema,
  preAuthJwtSchema,
  preAuthTokenSchema,
  registerSchema,
  resetPasswordSchema,
  selectOrganizationSchema,
  sessionJwtSchema,
  tokenSchema,
  updateUserSchema,
} from "./auth.schema";

export type Login = z.infer<typeof loginSchema>;
export type PreAuthToken = z.infer<typeof preAuthTokenSchema>;
export type Token = z.infer<typeof tokenSchema>;
export type PreAuthJwt = z.infer<typeof preAuthJwtSchema>;
export type SessionJwt = z.infer<typeof sessionJwtSchema>;
// Keep Jwt as alias for SessionJwt
export type Jwt = SessionJwt;
export type SelectOrganization = z.infer<typeof selectOrganizationSchema>;
export type Register = z.infer<typeof registerSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type InviteUser = z.infer<typeof inviteUserSchema>;
export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
