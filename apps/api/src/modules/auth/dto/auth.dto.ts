import { createZodDto } from "nestjs-zod";
import {
  changePasswordSchema,
  createOrganizationSchema,
  forgotPasswordSchema,
  inviteUserSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  selectOrganizationSchema,
  updateUserSchema,
  verifyEmailSchema,
} from "@repo/schema";

export class RegisterDto extends createZodDto(registerSchema) {}
export class UserUpdateRequest extends createZodDto(updateUserSchema) {}
export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
export class InviteUserDto extends createZodDto(inviteUserSchema) {}
export class SelectOrganizationDto extends createZodDto(selectOrganizationSchema) {}
export class CreateOrganizationDto extends createZodDto(createOrganizationSchema) {}
export class VerifyEmailDto extends createZodDto(verifyEmailSchema) {}
export class ResendVerificationDto extends createZodDto(resendVerificationSchema) {}