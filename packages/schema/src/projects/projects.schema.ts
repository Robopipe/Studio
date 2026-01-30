import z from "zod";

export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  organizationId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProjectRequestSchema = z.object({
  name: z.string().min(1).max(256),
});

export const updateProjectRequestSchema = z.object({
  name: z.string().min(1).max(256),
});

export const projectListResponseSchema = z.object({
  projects: z.array(projectSchema),
});
