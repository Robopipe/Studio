import z from "zod";

export const annotationTypeEnum = z.enum(["rectangle", "polygon", "classification"]);

export const annotationBoxStatsSchema = z.object({
  min: z.number(),
  q1: z.number(),
  median: z.number(),
  q3: z.number(),
  max: z.number(),
  whiskerLow: z.number(),
  whiskerHigh: z.number(),
  outliers: z.number().array(),
  outlierCount: z.number(),
});

export const annotationLabelStatSchema = z.object({
  labelId: z.number(),
  name: z.string(),
  color: z.string(),
  instanceCount: z.number(),
  area: annotationBoxStatsSchema.nullable(),
});

export const annotationAvailableTypesSchema = z.object({
  rectangle: z.boolean(),
  polygon: z.boolean(),
  classification: z.boolean(),
});

export const analyticsDatasetStatsSchema = z.object({
  availableTypes: annotationAvailableTypesSchema,
  labels: annotationLabelStatSchema.array(),
});

export const analyticsDatasetStatsQuerySchema = z.object({
  types: z
    .string()
    .optional()
    .transform((val): z.infer<typeof annotationTypeEnum>[] => {
      const all: z.infer<typeof annotationTypeEnum>[] = ["rectangle", "polygon", "classification"];
      if (!val) return all;
      return val
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is z.infer<typeof annotationTypeEnum> =>
          annotationTypeEnum.options.includes(s as z.infer<typeof annotationTypeEnum>),
        );
    }),
});
