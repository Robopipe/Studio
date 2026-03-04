import z from "zod";
import {
  forgotPasswordSchema,
  inviteUserSchema,
  jwtSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
  updateUserSchema,
} from "./auth.schema";

export type Login = z.infer<typeof loginSchema>;
export type Token = z.infer<typeof tokenSchema>;
export type Jwt = z.infer<typeof jwtSchema>;
export type Register = z.infer<typeof registerSchema>
export type UpdateUserRequest = z.infer<typeof updateUserSchema>
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type InviteUser = z.infer<typeof inviteUserSchema>;