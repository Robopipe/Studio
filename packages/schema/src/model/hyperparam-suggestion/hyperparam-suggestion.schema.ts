import z from "zod";
import { ProjectTypeEnum } from "../../projects";
import {
  ModelBackendEnum,
  ModelOutputTypeEnum,
  ModelQuantizationEnum,
} from "../model.schema";
import {
  buildParamValueSchema,
  HYPERPARAM_SUGGESTION_REGISTRY,
} from "./registry";

export enum SuggestionWarningSeverityEnum {
  INFO = "info",
  WARNING = "warning",
  CRITICAL = "critical",
}

/**
 * Snapshot of the create-model form sent for analysis. Everything except
 * `epochs` and `currentHyperparams` is a fixed constraint — Gemini gets it as
 * context and may warn about it, but only suggests hyperparams + epochs.
 */
export const suggestHyperparamsRequestSchema = z.object({
  backend: z.enum(ModelBackendEnum).default(ModelBackendEnum.ULTRALYTICS),
  /** Empty = all project tasks (same convention as dataset-stats) */
  taskIds: z.number().array().default([]),
  /** Active label selection; empty = all project labels */
  labelIds: z.number().array().default([]),
  trainingType: z.enum(ProjectTypeEnum),
  annotationsUsed: z.enum(ProjectTypeEnum).array(),
  epochs: z.number().int().positive().nullable().default(null),
  currentHyperparams: z.record(z.string(), z.unknown()).default({}),
  splitTrain: z.number(),
  splitValidate: z.number(),
  splitTest: z.number(),
  quantization: z.enum(ModelQuantizationEnum),
  outputTypes: z.enum(ModelOutputTypeEnum).array().default([]),
  useGroups: z.boolean().default(false),
});

export const suggestionWarningSchema = z.object({
  severity: z.enum(SuggestionWarningSeverityEnum),
  message: z.string(),
  /** Label names the warning is about, when label-specific */
  affectedLabels: z.string().array().optional(),
});

export const suggestedParamSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
  reasoning: z.string(),
});

export const suggestedEpochsSchema = z.object({
  value: z.number().int().positive(),
  reasoning: z.string(),
});

export const suggestHyperparamsResponseSchema = z.object({
  backend: z.enum(ModelBackendEnum),
  epochs: suggestedEpochsSchema,
  /** Keyed by registry param name; web orders rows via registry insertion order */
  params: z.record(z.string(), suggestedParamSchema),
  warnings: suggestionWarningSchema.array(),
  summary: z.string(),
  /** Which images Gemini saw (UI transparency) */
  sampledTaskIds: z.number().array(),
});

/**
 * The schema Gemini's structured output is constrained to AND validated
 * against. Fixed-shape object per registry param — deliberately no z.record:
 * Gemini handles explicit `properties` well but `additionalProperties` poorly.
 */
export const getGeminiSuggestionSchema = (backend: ModelBackendEnum) => {
  const entry = HYPERPARAM_SUGGESTION_REGISTRY[backend];
  if (!entry) {
    throw new Error(`No hyperparam suggestion registry entry for ${backend}`);
  }
  const paramShape = Object.fromEntries(
    Object.entries(entry.params).map(([name, def]) => [
      name,
      z
        .object({
          value: buildParamValueSchema(def),
          reasoning: z
            .string()
            .describe("One short sentence explaining this choice"),
        })
        .optional(),
    ]),
  );
  return z.object({
    epochs: z.object({
      value: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .describe(
          "Total training epochs, sized to the dataset (small datasets converge in fewer epochs but benefit from patience; very small ones overfit past ~150).",
        ),
      reasoning: z.string().describe("One short sentence explaining this choice"),
    }),
    params: z.object(paramShape),
    warnings: z
      .array(
        z.object({
          severity: z
            .enum(SuggestionWarningSeverityEnum)
            .describe(
              "critical = training likely to fail or produce an unusable model; warning = quality risk; info = advisory",
            ),
          message: z.string().describe("Actionable, user-facing message"),
          affectedLabels: z
            .array(z.string())
            .nullable()
            .describe("Label names this warning concerns, or null"),
        }),
      )
      .describe(
        "Dataset/setup problems derived from the analytics: too few images, class imbalance, labels without examples, tiny objects vs image size, epochs mismatch, split issues, etc. Empty if none.",
      ),
    summary: z
      .string()
      .describe("2-3 sentence overall rationale for the suggested configuration"),
  });
};

export type GeminiSuggestion = z.infer<
  ReturnType<typeof getGeminiSuggestionSchema>
>;
