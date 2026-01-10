import type { SecretsProvider } from './secrets-provider.interface';

export interface EnvSecretsProviderConfig {
  type: 'env';
  prefix?: string;
}

export class EnvSecretsProvider implements SecretsProvider {
  private readonly prefix?: string;

  constructor(config: EnvSecretsProviderConfig) {
    this.prefix = config.prefix;
  }

  async getSecret(name: string): Promise<string | undefined> {
    const withPrefix = this.prefix
      ? process.env[`${this.prefix}${name}`]
      : undefined;
    return withPrefix ?? process.env[name];
  }
}
