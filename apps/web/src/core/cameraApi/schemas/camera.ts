import z from "zod";

// Device Info Schema
export const deviceInfoSchema = z.object({
  mxid: z.string(),
  name: z.string(),
  camera_name: z.string(),
  platform: z.string(),
  protocol: z.string(),
  state: z.enum([
    "X_LINK_ANY_STATE",
    "X_LINK_BOOTED",
    "X_LINK_BOOTLOADER",
    "X_LINK_FLASH_BOOTED",
    "X_LINK_UNBOOTED",
  ]),
  status: z.enum(["X_LINK_SUCCESS"]),
});

export type DeviceInfo = z.infer<typeof deviceInfoSchema>;
