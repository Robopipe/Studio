import { createZodDto } from "nestjs-zod";
import z from "zod";

export const appConfigSchema = z.object({
  server: z
    .object({
      host: z.string(),
      port: z.number(),
    })
    .default({ port: 3000, host: "localhost" }),
  databaseUrl: z.string(),
  jwtSecret: z.string(),
});

export class AppConfig extends createZodDto(appConfigSchema) {}
