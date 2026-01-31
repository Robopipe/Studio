import z from "zod";

// Stream Info Schema
export const streamInfoSchema = z.object({
  name: z.string(),
  active: z.boolean().optional(),
  // Add other stream info fields as needed
});

export type StreamInfo = z.infer<typeof streamInfoSchema>;

// Camera Config Properties Schema (Base)
export const cameraConfigPropertiesSchema = z.object({
  fps: z.number().optional(),
  video_size: z.tuple([z.number(), z.number()]).optional(),
  still_size: z.tuple([z.number(), z.number()]).optional(),
  resolution: z.string().optional(),
});

export type CameraConfigProperties = z.infer<
  typeof cameraConfigPropertiesSchema
>;

// Sensor Focus Schema
export const sensorFocusSchema = z.object({
  auto_focus_mode: z
    .enum([
      "OFF",
      "AUTO",
      "MACRO",
      "CONTINUOUS_VIDEO",
      "CONTINUOUS_PICTURE",
      "EDOF",
    ])
    .optional(),
  auto_focus_trigger: z.boolean().optional(),
  lens_position: z.number().min(0).max(1).optional(),
});

export type SensorFocus = z.infer<typeof sensorFocusSchema>;

// Sensor Control Schema
export const sensorControlSchema = z.object({
  exposure_time: z
    .number()
    .int()
    .min(1)
    .max(33000)
    .optional()
    .describe("Exposure time in microseconds"),
  sensitivity_iso: z.number().int().min(100).max(5000).optional(),
  auto_exposure_enable: z.boolean().optional(),
  auto_exposure_compensation: z.number().int().min(-9).max(9).optional(),
  auto_exposure_limit: z
    .number()
    .int()
    .optional()
    .describe("Maximum exposure time limit for auto-exposure in microseconds"),
  auto_exposure_lock: z.boolean().optional(),
  contrast: z.number().int().min(-10).max(10).optional(),
  brightness: z.number().int().min(-10).max(10).optional(),
  saturation: z.number().int().min(-10).max(10).optional(),
  chroma_denoise: z.number().int().min(0).max(4).optional(),
  luma_denoise: z.number().int().min(0).max(4).optional(),
  auto_whitebalance_lock: z.boolean().optional(),
  auto_whitebalance_mode: z
    .enum([
      "AUTO",
      "CLOUDY_DAYLIGHT",
      "DAYLIGHT",
      "FLUORESCENT",
      "INCANDESCENT",
      "OFF",
      "SHADE",
      "TWILIGHT",
      "WARM_FLUORESCENT",
    ])
    .optional(),
  manual_whitebalance: z.number().int().min(1000).max(12000).optional(),
  focus: z.union([sensorFocusSchema, z.null()]).optional(),
});

export type SensorControl = z.infer<typeof sensorControlSchema>;

// Capture Still Image Query Params
export const captureStillQuerySchema = z.object({
  format: z.union([z.string(), z.null()]).optional().default("jpeg"),
});

export type CaptureStillQuery = z.infer<typeof captureStillQuerySchema>;
