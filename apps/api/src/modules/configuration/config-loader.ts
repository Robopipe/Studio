import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';

const env = process.env.APP_ENV || 'local';
const secretPrefix = `${env}_be_`;
const configFilename = env === 'local' ? 'config.local.yml' : 'config.yml';
const client = new SecretManagerServiceClient();

/**
 * ConfigLoader
 * @description A class that loads the configuration from the config file and secrets manager.
 */
export class ConfigLoader {
  public static async getConfig() {
    const config = load(
      readFileSync(join(process.cwd(), configFilename), 'utf8'),
    ) as Record<string, any>;

    const appliedConfig = await this.applyConfig(config);

    return appliedConfig as Record<string, any>;
  }

  /**
   * loadSecrets
   * @description A function that loads the secrets from the secrets manager.
   * @param secretNames The names of the secrets to load.
   * @param project The name of the project in GCP.
   * @returns An object containing the loaded secrets.
   */
  private static async loadSecrets(
    secretNames: string[] | undefined,
    project: string,
  ) {
    const secrets = {};
    if (Array.isArray(secretNames))
      for (const secretName of secretNames) {
        secrets[secretName] = await this.getSecretValue(project, secretName);
      }

    return secrets;
  }

  /**
   * getSecretValue
   * @description A function that gets the value of a secret from the secrets manager.
   * @param project The name of the project in GCP.
   * @param name The name of the secret.
   * @returns The value of the secret.
   */
  private static async getSecretValue(project: string, name: string) {
    const [secretVersion] = await client.accessSecretVersion({
      name: `projects/${project}/secrets/${secretPrefix}${name}/versions/latest`,
    });

    return secretVersion.payload?.data?.toString();
  }

  /**
   * applyConfig
   * @description A function that parses the configuration object and loads the secrets to it.
   * @param config The configuration object.
   * @returns The configuration object with the secrets loaded.
   */
  private static async applyConfig(config: Record<string, any>) {
    const secrets = await this.loadSecrets(config.secrets, config.project);

    //Rewrite config values based on env
    for (const key in config[env]) config[key] = config[env][key];

    return {
      ...config,
      ...secrets,
    };
  }
}
