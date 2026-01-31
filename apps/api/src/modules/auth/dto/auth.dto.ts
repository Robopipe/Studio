import { createZodDto } from "nestjs-zod";
import { registerSchema } from "@repo/schema";

export class RegisterDto extends createZodDto(registerSchema) {}
