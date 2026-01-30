import z from "zod";
import {
  jwtSchema,
  tokenSchema,
  loginSchema,
  registerSchema,
} from "./auth.schema";

export type Login = z.infer<typeof loginSchema>;
export type Token = z.infer<typeof tokenSchema>;
export type Jwt = z.infer<typeof jwtSchema>;
export type Register = z.infer<typeof registerSchema>
