import z from "zod";
import { createLabelSchema, labelSchema } from "./label.schema";

export type Label = z.infer<typeof labelSchema>;

export type CreateLabel = z.infer<typeof createLabelSchema>;
