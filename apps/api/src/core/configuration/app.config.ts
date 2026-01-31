import { createZodDto } from "nestjs-zod";
import z from "zod";
import { appEnvSchema } from "./schema/app-env.schema";

export const appConfigSchema = z.object({
  env: appEnvSchema.default("local"),
  server: z
    .object({
      host: z.string(),
      port: z.number(),
    })
    .default({ port: 3000, host: "localhost" }),
  databaseUrl: z.string(),
  jwt: z.object({
    secret: z.string(),
    accessTokenDuration: z.int().optional(),
    refreshTokenDuration: z.int().optional(),
  }),
  storage: z.object({
    bucketName: z.string(),
  }),
  apiHost: z.url().default("http://localhost:3000"),
  webHost: z.url().optional(),
  cookieSecret: z.string(),
});

export class AppConfig extends createZodDto(appConfigSchema) {}
