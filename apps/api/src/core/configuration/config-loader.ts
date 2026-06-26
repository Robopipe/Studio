
/**
 * ConfigLoader
 * @description A class that loads the configuration from the .env file
 */
export class ConfigLoader {

  /**
   * getConfig
   * @description A function that parses the configuration object and loads the secrets to it.
   * @param config The configuration object.
   * @returns The configuration object with the secrets loaded.
   */
  public static async getConfig() {

    const env = process.env.APP_ENV || "local";
    const host = process.env.HOST || "localhost";
    const port = process.env.PORT || "3000";
    const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@postgres:5432/robopipe";
    const webHost = process.env.WEB_HOST || "http://localhost:5173";
    const mlHostYolo = process.env.ML_HOST_YOLO || undefined;
    const mlRegion = process.env.ML_REGION || undefined;
    const gcpProject = process.env.GCP_PROJECT || undefined;
    const apiHost = process.env.API_HOST || "http://localhost:3000";
    const jwtSecret = process.env.JWT_SECRET || "supersecret";
    const mlSecret = process.env.ML_SECRET || "supersecret";
    const bucketName = process.env.BUCKET_NAME || "robopipe-staging-assets";
    const cookieSecret =  process.env.COOKIE_SECRET || "supersecret";
    const sendgridApiKey = process.env.SENDGRID_API_KEY || undefined;
    const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL || undefined;

    const mlBatchImageYolo = process.env.ML_BATCH_IMAGE_YOLO || undefined;
    const mlBatchServiceAccount = process.env.ML_BATCH_SERVICE_ACCOUNT || undefined;
    const mlBatchMachineType = process.env.ML_BATCH_MACHINE_TYPE || undefined;
    const mlBatchGpuType = process.env.ML_BATCH_GPU_TYPE || undefined;
    const mlBatchGpuCount = process.env.ML_BATCH_GPU_COUNT
      ? Number(process.env.ML_BATCH_GPU_COUNT)
      : undefined;
    const mlBatchBootDiskGb = process.env.ML_BATCH_BOOT_DISK_GB
      ? Number(process.env.ML_BATCH_BOOT_DISK_GB)
      : undefined;
    const mlBatchMaxRunSeconds = process.env.ML_BATCH_MAX_RUN_SECONDS
      ? Number(process.env.ML_BATCH_MAX_RUN_SECONDS)
      : undefined;
    const mlBatchTaskCpuMilli = process.env.ML_BATCH_TASK_CPU_MILLI
      ? Number(process.env.ML_BATCH_TASK_CPU_MILLI)
      : undefined;
    const mlBatchTaskMemoryMib = process.env.ML_BATCH_TASK_MEMORY_MIB
      ? Number(process.env.ML_BATCH_TASK_MEMORY_MIB)
      : undefined;
    const mlBatchShmSize = process.env.ML_BATCH_SHM_SIZE || undefined;
    const mlBatchApiKeySecret = process.env.ML_BATCH_API_KEY_SECRET || undefined;
    const mlBatchHubaiApiKeySecret = process.env.ML_BATCH_HUBAI_API_KEY_SECRET || undefined;
    const mlBatchNetwork = process.env.ML_BATCH_NETWORK || undefined;
    const mlBatchSubnetwork = process.env.ML_BATCH_SUBNETWORK || undefined;

    // ml-infer Cloud Run service — on-demand pre-annotation. Optional in
    // local dev (the prototype CLI works without it); required in deployed
    // environments. mlInferApiKey defaults to the placeholder so an
    // unconfigured deploy still boots and the auth check fails closed.
    const mlInferUrl = process.env.ML_INFER_URL || undefined;
    const mlInferApiKey = process.env.ML_INFER_API_KEY || "supersecret";

    // Confidence-report backend. Full Cloud Run Job resource name in deployed
    // environments; mlHostInfer is the HTTP fallback for local dev.
    const mlInferJobName = process.env.ML_INFER_JOB_NAME || undefined;
    const mlHostInfer = process.env.ML_HOST_INFER || undefined;

    const config:Record<string, string|number|undefined> = {
      env,
      databaseUrl,
      webHost,
      mlHostYolo,
      mlRegion,
      gcpProject,
      apiHost,
      jwtSecret,
      mlSecret,
      bucketName,
      cookieSecret,
      host,
      port,
      sendgridApiKey,
      sendgridFromEmail,
      mlBatchImageYolo,
      mlBatchServiceAccount,
      mlBatchMachineType,
      mlBatchGpuType,
      mlBatchGpuCount,
      mlBatchBootDiskGb,
      mlBatchMaxRunSeconds,
      mlBatchTaskCpuMilli,
      mlBatchTaskMemoryMib,
      mlBatchShmSize,
      mlBatchApiKeySecret,
      mlBatchHubaiApiKeySecret,
      mlBatchNetwork,
      mlBatchSubnetwork,
      mlInferUrl,
      mlInferApiKey,
      mlInferJobName,
      mlHostInfer,
    }

    return config;
  }
}
