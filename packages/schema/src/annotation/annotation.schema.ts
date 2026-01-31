import z from "zod";

export enum AnnotationStatusEnum {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE"
}


export const createAnnotationSchema = z.object({
  lead_time: z.number(),
  result: z.record(z.string(), z.any()).array(),
  draft_id: z.number(), // 0 when none
  started_at: z.iso.datetime(),
  project: z.string()
})


export const annotationSchema = z.object({
  id: z.number(),
  status: z.enum(AnnotationStatusEnum),
  result: z.record(z.string(), z.any()).array(),
  created_username: z.string(),
  created_ago: z.string(),
  completed_by: z.number(), // User ID
  was_cancelled: z.boolean(),
  ground_truth: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  draft_created_at: z.iso.datetime(),
  lead_time: z.number(),
  import_id: z.null(),
  last_action: z.null(),
  bulk_created: z.boolean(),
  task: z.number(), // Task ID
  project: z.number(), // Project ID
  updated_by: z.number(), // User ID
  parent_prediction: z.null(),
  parent_annotation: z.null(),
  last_created_by: z.null()
})
