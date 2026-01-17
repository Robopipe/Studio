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
