import { labelSchema } from "./label.schema";
import z from "zod";

export type Label = z.infer<typeof labelSchema>
