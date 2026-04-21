
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
    const mlHost = process.env.ML_HOST || undefined;
    const mlRegion = process.env.ML_REGION || undefined;
    const gcpProject = process.env.GCP_PROJECT || undefined;
    const apiHost = process.env.API_HOST || "http://localhost:3000";
    const jwtSecret = process.env.JWT_SECRET || "supersecret";
    const mlSecret = process.env.ML_SECRET || "supersecret";
    const bucketName = process.env.BUCKET_NAME || "robopipe-staging-assets";
    const cookieSecret =  process.env.COOKIE_SECRET || "supersecret";
    const sendgridApiKey = process.env.SENDGRID_API_KEY || undefined;
    const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL || undefined;

    const mlBatchImage = process.env.ML_BATCH_IMAGE || undefined;
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
    const mlBatchApiKeySecret = process.env.ML_BATCH_API_KEY_SECRET || undefined;
    const mlBatchHubaiApiKeySecret = process.env.ML_BATCH_HUBAI_API_KEY_SECRET || undefined;
    const mlBatchNetwork = process.env.ML_BATCH_NETWORK || undefined;
    const mlBatchSubnetwork = process.env.ML_BATCH_SUBNETWORK || undefined;

    const config:Record<string, string|number|undefined> = {
      env,
      databaseUrl,
      webHost,
      mlHost,
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
      mlBatchImage,
      mlBatchServiceAccount,
      mlBatchMachineType,
      mlBatchGpuType,
      mlBatchGpuCount,
      mlBatchBootDiskGb,
      mlBatchMaxRunSeconds,
      mlBatchApiKeySecret,
      mlBatchHubaiApiKeySecret,
      mlBatchNetwork,
      mlBatchSubnetwork,
    }

    return config;
  }
}
