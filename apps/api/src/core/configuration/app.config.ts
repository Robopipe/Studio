import { createZodDto } from "nestjs-zod";
import z from "zod";
import { appEnvSchema } from "./schema/app-env.schema";

export const appConfigSchema = z.object({
  env: appEnvSchema.default("local"),
  host: z.string(),
  port: z.string(),
  databaseUrl: z.string(),
  jwtSecret: z.string(),
  jwtAccessTokenDuration: z.number().int().optional(),
  jwtRefreshTokenDuration: z.number().int().optional(),
  bucketName: z.string(),
  mlSecret: z.string(),
  webHost: z.string(),
  apiHost: z.string(),
  // FastAPI host for the (sole) ml-yolo training service. Named *Yolo to match
  // the ML_HOST_YOLO deploy env var. Used for local dev; empty in Cloud
  // deploys, which dispatch via Cloud Batch (mlBatchImageYolo) instead.
  mlHostYolo: z.string().optional(),
  mlRegion: z.string().optional(),
  gcpProject: z.string().optional(),
  // Cloud Batch: when `mlBatchImageYolo` is set, training jobs are dispatched
  // as Cloud Batch jobs that boot a VM with the configured GPU. When
  // `mlHostYolo` is set instead, training is POSTed to the FastAPI service.
  mlBatchImageYolo: z.string().optional(),
  mlBatchServiceAccount: z.string().optional(),
  mlBatchMachineType: z.string().default("a2-ultragpu-1g"),
  // Empty mlBatchGpuType = use the GPU bundled with the machine type (A2/A3/G2).
  // Set to something like "nvidia-tesla-t4" together with a non-zero count only
  // for N1-style custom GPU attachment.
  mlBatchGpuType: z.string().default(""),
  mlBatchGpuCount: z.number().int().default(0),
  mlBatchBootDiskGb: z.number().int().default(100),
  mlBatchMaxRunSeconds: z.number().int().default(86400),
  // Resources allocated to the single training task on the VM. Batch defaults
  // to ~2 vCPU / ~2 GiB per task when these are unset, regardless of machine
  // size, so you must set them explicitly to use the full VM. Defaults target
  // a2-ultragpu-1g (12 vCPU / 170 GiB), leaving ~1 vCPU and ~10 GiB for the
  // Batch agent + OS.
  mlBatchTaskCpuMilli: z.number().int().default(11000),
  mlBatchTaskMemoryMib: z.number().int().default(163840),
  // Shared memory for the training container (/dev/shm). Docker defaults to
  // 64 MiB, which is far too small for PyTorch DataLoader with num_workers>0.
  // Accepts docker-style suffix (e.g. "16g", "32g").
  mlBatchShmSize: z.string().default("16g"),
  mlBatchApiKeySecret: z.string().optional(),
  mlBatchHubaiApiKeySecret: z.string().optional(),
  mlBatchNetwork: z.string().optional(),
  mlBatchSubnetwork: z.string().optional(),
  cookieSecret: z.string(),
  sendgridApiKey: z.string().optional(),
  sendgridFromEmail: z.string().optional(),
  // ml-infer Cloud Run service for on-demand pre-annotation. mlInferUrl
  // empty disables the predict endpoint (local dev without the service).
  mlInferUrl: z.string().optional(),
  mlInferApiKey: z.string(),
});

export class AppConfig extends createZodDto(appConfigSchema) {}
