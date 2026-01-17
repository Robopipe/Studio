import z from "zod";

export const appEnvSchema = z.enum([
  "local",
  "development",
  "production",
  "test",
]);

export type AppEnv = z.infer<typeof appEnvSchema>;
