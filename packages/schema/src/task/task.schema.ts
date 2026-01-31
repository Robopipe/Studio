import z from "zod";
import { annotationSchema } from "../annotation";

export const taskSchema = z.object({
  id: z.number(),
  predictions: z.literal([]), // We don't use this ... yet
  annotations: annotationSchema.array(),
  drafts: annotationSchema.array(),
  annotators: z.number().array(), // Probably user IDs, who knows
  inner_id: z.number(),
  cancelled_annotations: z.number(),
  total_annotations: z.number(),
  total_predictions: z.literal(0),
  completed_at: z.iso.datetime(),
  annotations_results: z.string(),
  predictions_results: z.literal(""),
  predictions_score: z.null(),
  file_upload: z.string(), // File name
  storage_filename: z.null(),
  annotations_ids: z.string(), // Aggregated annotation IDs, why? dont know
  predictions_model_versions: z.string(),
  avg_lead_time: z.number(),
  draft_exists: z.boolean(),
  updated_by: z.object().array(), // I think this can be empty
  data: z.object({
    image: z.string(), // Almost the same as file_upload
  }),
  meta: z.record(z.string(), z.any()), // Dont know whats here
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  is_labeled: z.boolean(),
  allow_skip: z.boolean(),
  overlap: z.number(),
  comment_count: z.number(),
  unresolved_comment_count: z.number(),
  last_comment_updated_at: z.iso.datetime().nullable(),
  project: z.number(), // Project ID
  comment_authors: z.any().array(), // Dont know
})


export const taskShortSchema = taskSchema.pick({
  id: true,
  drafts: true,
  annotators: true,
  inner_id: true,
  cancelled_annotations: true,
  total_annotations: true,
  total_predictions: true,
  completed_at: true,
  annotations_results: true,
  predictions_results: true,
  file_upload: true,
  storage_filename: true,
  annotations_ids: true,
  predictions_model_versions: true,
  updated_by: true,
  data: true,
  meta: true,
  created_at: true,
  updated_at: true,
  is_labeled: true,
  allow_skip: true,
  overlap: true,
  comment_count: true,
  unresolved_comment_count: true,
  last_comment_updated_at: true,
  project: true,
  comment_authors: true
})

export const taskListResponseSchema = z.object({
  total_annotations: z.number(),
  total_predictions: z.number(),
  total: z.number(),
  tasks: taskShortSchema.array(),
});
