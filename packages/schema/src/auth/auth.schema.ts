import z from "zod";
import { userSchema } from "../users";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().nonempty(),
});

export const tokenSchema = z.object({
  accessToken: z.string().nonempty(),
  user: userSchema,
});

export const jwtSchema = z.object({
  sub: z.int(),
  iat: z.int(),
  exp: z.int(),
});

export const registerSchema = loginSchema.extend({
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
  fullName: z.string().nonempty(),
});