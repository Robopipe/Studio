import z from "zod";
import { userSchema } from "./users.schema";

export type User = z.infer<typeof userSchema>;
