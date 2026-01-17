import z from "zod";
import { jwtSchema, tokenSchema, loginSchema } from "./auth.schema";

export type Login = z.infer<typeof loginSchema>;
export type Token = z.infer<typeof tokenSchema>;
export type Jwt = z.infer<typeof jwtSchema>;
