import { createZodDto } from "nestjs-zod";
import {
  forgotPasswordSchema,
  inviteUserSchema,
  registerSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "@repo/schema";

export class RegisterDto extends createZodDto(registerSchema) {}
export class UserUpdateRequest extends createZodDto(updateUserSchema) {}
export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class InviteUserDto extends createZodDto(inviteUserSchema) {}