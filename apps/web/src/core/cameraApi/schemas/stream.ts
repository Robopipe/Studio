import z from "zod";

// Stream Info Schema
export const streamInfoSchema = z.object({
  name: z.string(),
  active: z.boolean().optional(),
  replay: z.boolean(),
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

export const autoFocusModeSchema = z.enum([
  "OFF",
  "AUTO",
  "MACRO",
  "CONTINUOUS_VIDEO",
  "CONTINUOUS_PICTURE",
  "EDOF",
]);
export type AutoFocusMode = z.infer<typeof autoFocusModeSchema>;

export const autoWhitebalanceModeSchema = z.enum([
  "OFF",
  "AUTO",
  "INCANDESCENT",
  "FLUORESCENT",
  "WARM_FLUORESCENT",
  "DAYLIGHT",
  "CLOUDY_DAYLIGHT",
  "TWILIGHT",
  "SHADE",
]);
export type AutoWhitebalanceMode = z.infer<typeof autoWhitebalanceModeSchema>;

export const antiBandingModeSchema = z.enum([
  "OFF",
  "MAINS_50_HZ",
  "MAINS_60_HZ",
  "AUTO",
]);
export type AntiBandingMode = z.infer<typeof antiBandingModeSchema>;

// Sensor Focus Schema
export const sensorFocusSchema = z.object({
  auto_focus_mode: autoFocusModeSchema,
  auto_focus_trigger: z.boolean(),
  lens_position: z.number().min(0).max(1),
});

export type SensorFocus = z.infer<typeof sensorFocusSchema>;

// Sensor Control Schema — must stay in sync with backend
// robopipe_api/camera/sensor/sensor_control.py::SensorControl
export const sensorControlSchema = z.object({
  // Exposure
  auto_exposure_enable: z.boolean(),
  exposure_time: z.number().int().min(1).max(33_000_000),
  sensitivity_iso: z.number().int().min(100).max(1_600),
  auto_exposure_compensation: z.number().int().min(-9).max(9),
  auto_exposure_limit: z.number().int().min(1).max(33_000_000),
  auto_exposure_lock: z.boolean(),

  // ISP
  contrast: z.number().int().min(-10).max(10),
  saturation: z.number().int().min(-10).max(10),
  sharpness: z.number().int().min(0).max(4),
  luma_denoise: z.number().int().min(0).max(4),
  chroma_denoise: z.number().int().min(0).max(4),

  // White balance
  auto_whitebalance_mode: autoWhitebalanceModeSchema,
  auto_whitebalance_lock: z.boolean(),
  manual_whitebalance: z.number().int().min(1000).max(12000),

  // Focus
  focus: z.union([sensorFocusSchema, z.null()]),

  // Misc
  anti_banding_mode: antiBandingModeSchema,
});

export type SensorControl = z.infer<typeof sensorControlSchema>;
export type SensorControlUpdate = Partial<SensorControl>;

// Sensor Control Capabilities
export const controlRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  default: z.number(),
  step: z.number().nullable().optional(),
});
export type ControlRange = z.infer<typeof controlRangeSchema>;

export const sensorTypeSchema = z.enum(["COLOR", "MONO", "THERMAL", "TOF"]);
export type SensorType = z.infer<typeof sensorTypeSchema>;

export const sensorControlCapabilitiesSchema = z.object({
  sensor_type: sensorTypeSchema,
  has_autofocus: z.boolean(),
  has_color_controls: z.boolean(),

  contrast: controlRangeSchema,
  sharpness: controlRangeSchema,
  luma_denoise: controlRangeSchema,
  exposure_time: controlRangeSchema,
  sensitivity_iso: controlRangeSchema,
  auto_exposure_compensation: controlRangeSchema,
  auto_exposure_limit: controlRangeSchema,

  saturation: controlRangeSchema.nullable().optional(),
  chroma_denoise: controlRangeSchema.nullable().optional(),
  manual_whitebalance: controlRangeSchema.nullable().optional(),
  lens_position: controlRangeSchema.nullable().optional(),

  auto_focus_modes: z.array(z.string()),
  auto_whitebalance_modes: z.array(z.string()).nullable().optional(),
  anti_banding_modes: z.array(z.string()),
});
export type SensorControlCapabilities = z.infer<
  typeof sensorControlCapabilitiesSchema
>;

// Capture Still Image Query Params
export const captureStillQuerySchema = z.object({
  format: z.union([z.string(), z.null()]).optional().default("jpeg"),
});

export type CaptureStillQuery = z.infer<typeof captureStillQuerySchema>;
