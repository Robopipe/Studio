import z from "zod";

export const nnTypeEnum = z.enum(["Generic", "Detection", "SpatialDetection"]);
export type NNType = z.infer<typeof nnTypeEnum>;

export const nnConfigSchema = z.object({
    type: nnTypeEnum,
    model_id: z.number().nullable().optional(),
    num_inference_threads: z.number().optional(),
    nn_config: z.record(z.string(), z.unknown()),
});
export type NNConfig = z.infer<typeof nnConfigSchema>;