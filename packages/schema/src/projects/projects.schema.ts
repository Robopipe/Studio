import z from "zod";

export enum ProjectTypeEnum {
  DETECTION = "DETECTION",
  CLASSIFICATION = "CLASSIFICATION",
  SEGMENTATION = "SEGMENTATION"
}

export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  organizationId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProjectRequestSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string(),
  labelConfig: z.string(),
});

export const updateProjectRequestSchema = z.object({
  name: z.string().min(1).max(256),
});

export const projectListResponseSchema = z.object({
  projects: z.array(projectSchema),
});


export const projectDmSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  label_config: z.string(),
  expert_instruction: z.string(),
  show_instruction: z.boolean(),
  show_skip_button: z.boolean(),
  enable_empty_annotation: z.boolean(),
  show_annotation_history: z.boolean(),
  organization: z.number(),
  color: z.string(),
  maximum_annotations: z.number(),
  is_published: z.boolean(),
  model_version: z.string(),
  is_draft: z.boolean(),
  created_by: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
  }),
  created_at: z.iso.datetime(),
  min_annotations_to_start_training: z.number(),
  start_training_on_annotation_update: z.boolean(),
  show_collab_predictions: z.boolean(),
  num_tasks_with_annotations: z.number().nullable(),
  task_number: z.number().nullable(),
  useful_annotation_number: z.number().nullable(),
  ground_truth_number: z.number().nullable(),
  skipped_annotations_number: z.number().nullable(),
  total_annotations_number: z.number().nullable(),
  total_predictions_number: z.number().nullable(),
  sampling: z.string(),
  show_ground_truth_first: z.boolean(),
  show_overlap_first: z.boolean(),
  overlap_cohort_percentage: z.number(),
  task_data_login: z.null(), // Dont know
  task_data_password: z.null(), // dont know
  control_weights: z.object({
    label: z.object({
      overall: z.number(),
      type: z.string(),
      labels: z.record(z.string(), z.number()), // Map label-name:number
    }),
  }),
  parsed_label_config: z.object({
    label: z.object({
      type: z.string(),
      to_name: z.string().array(),
      inputs: z
        .object({
          type: z.string(),
          valueType: z.null(), // DOnt know
          value: z.string(),
        })
        .array(),
      labels: z.string().array(), // Array of label names
      labels_attrs: z.record(
        z.string(),
        z.object({
          // Object with label name as keys
          value: z.string(),
          background: z.string(),
        }),
      ),
    }),
  }),
  evaluate_predictions_automatically: z.boolean(),
  config_has_control_tags: z.boolean(),
  skip_queue: z.string(),
  reveal_preannotations_interactively: z.boolean(),
  pinned_at: z.iso.datetime().nullable(),
  finished_task_number: z.number().nullable(),
  queue_total: z.number(),
  queue_done: z.number(),
  config_suitable_for_bulk_annotation: z.boolean(),
  state: z.null(), // Dont know
  can_delete_tasks: z.boolean(),
  can_manage_annotations: z.boolean(),
  can_manage_tasks: z.boolean(),
  source_syncing: z.boolean(),
  target_syncing: z.boolean(),
  task_count: z.number(),
  annotation_count: z.number(),
});
