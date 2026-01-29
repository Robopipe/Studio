import z from "zod";

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.email(),
  fullName: z.string(),
  organizationId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
})
