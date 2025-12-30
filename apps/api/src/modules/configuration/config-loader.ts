import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import type {
  SecretsProvider,
  SecretsProviderConfig,
} from './providers/secrets-provider.interface';
import { SecretsProviderRegistry } from './providers/secrets-provider.registry';

const env = process.env.APP_ENV || 'local';
const configFilename = env === 'local' ? 'config.local.yml' : 'config.yml';

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
    provider: SecretsProvider,
  ) {
    const secrets: Record<string, string | undefined> = {};
    if (Array.isArray(secretNames)) {
      for (const secretName of secretNames) {
        secrets[secretName] = await provider.getSecret(secretName);
      }
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
  /**
   * getSecretsProvider
   * @description Creates a secrets provider based on configuration.
   * Configuration can come from:
   * 1. config.secretsProviderConfig in YAML (highest priority)
   * 2. Environment variables (fallback)
   * @param config The loaded configuration object
   * @returns SecretsProvider instance
   */
  private static getSecretsProvider(
    config: Record<string, any>,
  ): SecretsProvider {
    // Check if config has explicit secretsProviderConfig
    if (
      config.secretsProviderConfig &&
      typeof config.secretsProviderConfig === 'object'
    ) {
      return SecretsProviderRegistry.create(
        config.secretsProviderConfig as SecretsProviderConfig,
      );
    }

    // Fallback to environment-based configuration
    const providerType = (process.env.SECRETS_PROVIDER || 'env').toLowerCase();
    const secretPrefix = process.env.SECRETS_PREFIX || `${env}_be_`;

    switch (providerType) {
      case 'env':
        return SecretsProviderRegistry.create({
          type: 'env',
          prefix: secretPrefix,
        });
      case 'file':
        return SecretsProviderRegistry.create({
          type: 'file',
          filename: env === 'local' ? 'secrets.local.yml' : 'secrets.yml',
          prefix: secretPrefix,
        });
      case 'gcp':
        return SecretsProviderRegistry.create({
          type: 'gcp',
          prefix: secretPrefix,
          project: process.env.GCP_PROJECT || process.env.CLOUD_PROJECT || '',
        });
      default:
        // For unknown types, try to create from registry
        return SecretsProviderRegistry.create({
          type: providerType,
          prefix: secretPrefix,
        });
    }
  }

  /**
   * applyConfig
   * @description A function that parses the configuration object and loads the secrets to it.
   * @param config The configuration object.
   * @returns The configuration object with the secrets loaded.
   */
  private static async applyConfig(config: Record<string, any>) {
    const provider = this.getSecretsProvider(config);
    const secretNames = Array.isArray(config.secrets)
      ? (config.secrets as string[])
      : undefined;
    const secrets = await this.loadSecrets(secretNames, provider);

    // Rewrite config values based on env if present
    if (config[env] && typeof config[env] === 'object') {
      for (const key in config[env]) config[key] = config[env][key];
    }

    return {
      ...config,
      ...secrets,
    };
  }
}
