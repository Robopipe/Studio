import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const appConfigSchema = z.object({
  sentryDsn: z.string().url().optional(),
  databaseUrl: z.string(),
  jwtSecret: z.string(),
});

export class AppConfig extends createZodDto(appConfigSchema) {}
