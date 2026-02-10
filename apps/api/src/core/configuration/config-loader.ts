
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
    const mlJobName = process.env.ML_JOB_NAME || undefined;
    const mlRegion = process.env.ML_REGION || undefined;
    const gcpProject = process.env.GCP_PROJECT || undefined;
    const apiHost = process.env.API_HOST || "http://localhost:3000";
    const jwtSecret = process.env.JWT_SECRET || "supersecret";
    const mlSecret = process.env.ML_SECRET || "supersecret";
    const bucketName = process.env.BUCKET_NAME || "robopipe-staging-assets";
    const cookieSecret =  process.env.COOKIE_SECRET || "supersecret";

    const config:Record<string, string|number|undefined> = {
      env,
      databaseUrl,
      webHost,
      mlHost,
      mlJobName,
      mlRegion,
      gcpProject,
      apiHost,
      jwtSecret,
      mlSecret,
      bucketName,
      cookieSecret,
      host,
      port
    }

    return config;
  }
}
