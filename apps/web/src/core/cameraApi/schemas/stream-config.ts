import z from "zod";

export const imgResizeModeSchema = z.enum(["CROP", "STRETCH", "LETTERBOX"]);
export type ImgResizeMode = z.infer<typeof imgResizeModeSchema>;

export const stillConfigSchema = z.object({
  width: z.number().int(),
  height: z.number().int(),
  fps: z.number().int(),
  resize_mode: imgResizeModeSchema.default("CROP"),
});
export type StillConfig = z.infer<typeof stillConfigSchema>;

export const stillConfigOptionSchema = z.object({
  width: z.number().int(),
  height: z.number().int(),
  min_fps: z.number().int(),
  max_fps: z.number().int(),
});
export type StillConfigOption = z.infer<typeof stillConfigOptionSchema>;
