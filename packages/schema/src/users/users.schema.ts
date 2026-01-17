import { createSelectSchema } from "drizzle-zod";
import { users } from "@repo/database/schema/entities/users";

const privateUserSchema = createSelectSchema(users);
export const userSchema = privateUserSchema.omit({ password: true });
