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
  mlRegion: z.string().optional(),
  gcpProject: z.string().optional(),
  // Cloud Batch: when `mlBatchImage` is set, training jobs are dispatched as
  // Cloud Batch jobs that boot a VM with the configured GPU. When `mlHost` is
  // set instead, training is POSTed to the FastAPI service for local dev.
  mlBatchImage: z.string().optional(),
  mlBatchServiceAccount: z.string().optional(),
  mlBatchMachineType: z.string().default("g2-standard-8"),
  mlBatchGpuType: z.string().default("nvidia-l4"),
  mlBatchGpuCount: z.number().int().default(1),
  mlBatchBootDiskGb: z.number().int().default(100),
  mlBatchMaxRunSeconds: z.number().int().default(86400),
  mlBatchApiKeySecret: z.string().optional(),
  mlBatchHubaiApiKeySecret: z.string().optional(),
  mlBatchNetwork: z.string().optional(),
  mlBatchSubnetwork: z.string().optional(),
  cookieSecret: z.string(),
  sendgridApiKey: z.string().optional(),
  sendgridFromEmail: z.string().optional(),
});

export class AppConfig extends createZodDto(appConfigSchema) {}
