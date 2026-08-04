import z from "zod";
import {
  runConfigurationSchema,
  updateRunConfigurationSchema,
} from "./run-configuration.schema";

export type RunConfiguration = z.infer<typeof runConfigurationSchema>;
export type UpdateRunConfiguration = z.infer<
  typeof updateRunConfigurationSchema
>;
