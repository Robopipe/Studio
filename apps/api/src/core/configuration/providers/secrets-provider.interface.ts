export interface SecretsProvider {
  getSecret(name: string): Promise<string | undefined>;
}

export interface SecretsProviderConfig {
  type: string;
  [key: string]: any;
}

export type SecretsProviderFactory = (
  config: SecretsProviderConfig,
) => SecretsProvider;
