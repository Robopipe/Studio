import { createZodDto } from "nestjs-zod";
import { registerSchema, updateUserSchema } from "@repo/schema";

export class RegisterDto extends createZodDto(registerSchema) {}
export class UserUpdateRequest extends createZodDto(updateUserSchema) {}