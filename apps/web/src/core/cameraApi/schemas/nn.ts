import z from "zod";

export const nnTypeEnum = z.enum(["Generic", "Detection", "SpatialDetection"]);
export type NNType = z.infer<typeof nnTypeEnum>;

export const nnConfigSchema = z.object({
    type: nnTypeEnum,
    model_id: z.number().nullable().optional(),
    num_inference_threads: z.number().optional(),
    nn_config: z.record(z.string(), z.unknown()),
    mask_max_dim: z.number().nullable().optional(),
    throttle_hz: z.number().nullable().optional(),
});
export type NNConfig = z.infer<typeof nnConfigSchema>;

export interface SahiConfig {
    slice_width: number;
    slice_height: number;
    overlap_ratio: number;
    nms_iou_threshold: number;
}

export const DEFAULT_SAHI_CONFIG: SahiConfig = {
    slice_width: 0.5,
    slice_height: 0.5,
    overlap_ratio: 0.2,
    nms_iou_threshold: 0.5,
};

/**
 * Runtime knobs that go onto NNConfig at deploy time. Separate from
 * SahiConfig because they're orthogonal — you can throttle / set threads
 * with or without SAHI enabled.
 */
export interface NNRuntimeConfig {
    num_inference_threads: number;
    /** Hz cap on detection WS broadcast. null = no throttle. */
    throttle_hz: number | null;
}

export const DEFAULT_NN_RUNTIME_CONFIG: NNRuntimeConfig = {
    num_inference_threads: 2,
    throttle_hz: null,
};