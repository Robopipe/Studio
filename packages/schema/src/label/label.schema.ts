import z from "zod";
import { timestampsSchema } from "../helpers";

export const labelSchema = z.object({
  id: z.number(),
  name: z.string(), // unique across project
  color: z.string(),
  ...timestampsSchema,
})



export const createLabelSchema = labelSchema.pick({
  name: true,
  color: true
})

export const updateLabelSchema = createLabelSchema
