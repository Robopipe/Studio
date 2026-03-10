import { createZodDto } from "nestjs-zod";
import {
  createOrganizationSchema,
  forgotPasswordSchema,
  inviteUserSchema,
  registerSchema,
  resetPasswordSchema,
  selectOrganizationSchema,
  updateUserSchema,
} from "@repo/schema";

export class RegisterDto extends createZodDto(registerSchema) {}
export class UserUpdateRequest extends createZodDto(updateUserSchema) {}
export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class InviteUserDto extends createZodDto(inviteUserSchema) {}
export class SelectOrganizationDto extends createZodDto(selectOrganizationSchema) {}
export class CreateOrganizationDto extends createZodDto(createOrganizationSchema) {}