import { createSelectSchema } from "drizzle-zod";
import { userTable } from "@repo/database/schema/entities/user";

const privateUserSchema = createSelectSchema(userTable);
export const userSchema = privateUserSchema.omit({ password: true });
