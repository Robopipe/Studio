import z from "zod";

export const columnSchema = z.object({
  id: z.string(), // image, id, inner_id, completed_at, ...
  title: z.string(), // same as ID but human friendly
  type: z.string(), // Data type: Image, Number, Datetime, List, String, and others, possibly
  help: z.string(),
  target: z.string(), // Usually "tasks"
  children: z.string().array().optional(), // There is master column with id data, which has children: "image"
  parent: z.string(), // usually "data"
  schema: z.object({
    items: z.number().array(),
    multiple: z.boolean().optional()
  }).optional(),
  visibility_defaults: z.object({
    explore: z.boolean(),
    labeling: z.boolean()
  }),
  project_defined: z.boolean()
})


export const columnsResponseSchema = z.object({
  columns: columnSchema.array()
})
