import z from "zod";
import { timestampsSchema } from "../helpers";

export enum UserRoleEnum {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.email(),
  fullName: z.string(),
  cameraApiUrl: z.url(),
  organizationId: z.number(),
  role: z.nativeEnum(UserRoleEnum),
  ...timestampsSchema
})
