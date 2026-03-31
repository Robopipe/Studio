import z from "zod";

// Reference: https://github.com/luxonis/luxonis-train/blob/main/configs/README.md

// --- Trainer sub-schemas ---

const namedParamsSchema = z
  .object({
    name: z.string().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const callbackSchema = z
  .object({
    name: z.string(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const normalizeSchema = z
  .object({
    active: z.boolean().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const augmentationSchema = z
  .object({
    name: z.string(),
    active: z.boolean().optional(),
    use_for_resizing: z.boolean().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const preprocessingSchema = z
  .object({
    train_image_size: z.array(z.number().int().positive()).optional(),
    keep_aspect_ratio: z.boolean().optional(),
    color_space: z.string().optional(),
    normalize: normalizeSchema.optional(),
    augmentations: z.array(augmentationSchema).optional(),
  })
  .strict();

const trainerConfigSchema = z
  .object({
    seed: z.number().int().optional(),
    deterministic: z.union([z.boolean(), z.literal("warn")]).optional(),
    batch_size: z.number().int().positive().optional(),
    accumulate_grad_batches: z.number().int().positive().optional(),
    precision: z.string().optional(),
    gradient_clip_val: z.number().optional(),
    gradient_clip_algorithm: z.string().optional(),
    use_weighted_sampler: z.boolean().optional(),
    epochs: z.number().int().positive().optional(),
    overfit_batches: z.number().int().nonnegative().optional(),
    n_workers: z.number().int().nonnegative().optional(),
    validation_interval: z.number().int().positive().optional(),
    n_log_images: z.number().int().nonnegative().optional(),
    skip_last_batch: z.boolean().optional(),
    accelerator: z.string().optional(),
    devices: z.union([z.number(), z.string(), z.array(z.number())]).optional(),
    matmul_precision: z.string().optional(),
    strategy: z.string().optional(),
    n_sanity_val_steps: z.number().int().nonnegative().optional(),
    profiler: z.string().optional(),
    pin_memory: z.boolean().optional(),
    save_top_k: z.number().int().optional(),
    n_validation_batches: z.number().int().positive().optional(),
    smart_cfg_auto_populate: z.boolean().optional(),
    resume_training: z.boolean().optional(),
    log_sub_losses: z.boolean().optional(),
    log_sub_metrics: z.boolean().optional(),
    preprocessing: preprocessingSchema.optional(),
    callbacks: z.array(callbackSchema).optional(),
    optimizer: namedParamsSchema.optional(),
    scheduler: namedParamsSchema.optional(),
    training_strategy: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

// --- Model sub-schemas ---

const freezingSchema = z
  .object({
    active: z.boolean().optional(),
    unfreeze_after: z.union([z.number().int(), z.number()]).optional(),
    lr_after_unfreeze: z.number().optional(),
  })
  .strict();

const nodeSchema = z
  .object({
    name: z.string(),
    variant: z.string().optional(),
    task_name: z.string().optional(),
    alias: z.string().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
    inputs: z.array(z.string()).optional(),
    freezing: freezingSchema.optional(),
    remove_on_export: z.boolean().optional(),
    losses: z.array(namedParamsSchema).optional(),
    metrics: z.array(namedParamsSchema).optional(),
    visualizers: z.array(namedParamsSchema).optional(),
  })
  .strict();

const predefinedModelSchema = z
  .object({
    name: z.string().optional(),
    variant: z.string().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const modelConfigSchema = z
  .object({
    name: z.string().optional(),
    weights: z.string().optional(),
    predefined_model: predefinedModelSchema.optional(),
    nodes: z.array(nodeSchema).optional(),
    outputs: z.array(z.unknown()).optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

// --- Loader sub-schema ---

const loaderConfigSchema = z
  .object({
    name: z.string().optional(),
    image_source: z.string().optional(),
    train_view: z.union([z.string(), z.array(z.string())]).optional(),
    val_view: z.union([z.string(), z.array(z.string())]).optional(),
    test_view: z.union([z.string(), z.array(z.string())]).optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

// --- Tracker sub-schema ---

const trackerConfigSchema = z
  .object({
    project_name: z.string().optional(),
    project_id: z.string().optional(),
    run_name: z.string().optional(),
    run_id: z.string().optional(),
    save_directory: z.string().optional(),
    is_tensorboard: z.boolean().optional(),
    is_wandb: z.boolean().optional(),
    wandb_entity: z.string().optional(),
    is_mlflow: z.boolean().optional(),
  })
  .strict();

// --- Top-level config ---

export const hyperparamsConfigSchema = z
  .object({
    model: modelConfigSchema.optional(),
    loader: loaderConfigSchema.optional(),
    trainer: trainerConfigSchema.optional(),
    tracker: trackerConfigSchema.optional(),
    exporter: z.record(z.string(), z.unknown()).optional(),
    tuner: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
