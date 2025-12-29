import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const appConfigSchema = z.object({
  project: z.literal('gcpProjectName'),
  sentryDsn: z.url().optional(),
  databaseUrl: z.string(),
  jwtSecret: z.string(),
});

export class AppConfig extends createZodDto(appConfigSchema) {}
