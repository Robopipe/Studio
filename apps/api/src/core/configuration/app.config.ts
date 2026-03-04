import { createZodDto } from "nestjs-zod";
import z from "zod";
import { appEnvSchema } from "./schema/app-env.schema";

export const appConfigSchema = z.object({
  env: appEnvSchema.default("local"),
  host: z.string(),
  port: z.string(),
  databaseUrl: z.string(),
  jwtSecret: z.string(),
  jwtAccessTokenDuration: z.number().int().optional(),
  jwtRefreshTokenDuration: z.number().int().optional(),
  bucketName: z.string(),
  mlSecret: z.string(),
  webHost: z.string(),
  apiHost: z.string(),
  mlHost: z.string().optional(),
  mlJobName: z.string().optional(),
  mlRegion: z.string().optional(),
  gcpProject: z.string().optional(),
  cookieSecret: z.string(),
  sendgridApiKey: z.string().optional(),
  sendgridFromEmail: z.string().optional(),
});

export class AppConfig extends createZodDto(appConfigSchema) {}
