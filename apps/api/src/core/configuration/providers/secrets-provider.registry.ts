import type {
  SecretsProvider,
  SecretsProviderConfig,
  SecretsProviderFactory,
} from './secrets-provider.interface';
import {
  EnvSecretsProvider,
  type EnvSecretsProviderConfig,
} from './env-secrets.provider';
import {
  FileSecretsProvider,
  type FileSecretsProviderConfig,
} from './file-secrets.provider';
import {
  GcpSecretsProvider,
  type GcpSecretsProviderConfig,
} from './gcp-secrets.provider';

/**
 * Registry for secrets provider factories.
 * Allows registration of custom providers for extensibility.
 */
export class SecretsProviderRegistry {
  private static factories = new Map<string, SecretsProviderFactory>();

  static {
    // Register built-in providers
    this.register(
      'env',
      (config) => new EnvSecretsProvider(config as EnvSecretsProviderConfig),
    );
    this.register(
      'file',
      (config) => new FileSecretsProvider(config as FileSecretsProviderConfig),
    );
    this.register(
      'gcp',
      (config) => new GcpSecretsProvider(config as GcpSecretsProviderConfig),
    );
  }

  /**
   * Register a custom secrets provider factory.
   * @param type The provider type identifier
   * @param factory Factory function that creates the provider instance
   */
  static register(type: string, factory: SecretsProviderFactory): void {
    this.factories.set(type.toLowerCase(), factory);
  }

  /**
   * Create a provider instance from configuration.
   * @param config Provider configuration with type and options
   * @returns SecretsProvider instance
   */
  static create(config: SecretsProviderConfig): SecretsProvider {
    const type = config.type.toLowerCase();
    const factory = this.factories.get(type);

    if (!factory) {
      throw new Error(
        `Unknown secrets provider type: ${config.type}. Available types: ${Array.from(this.factories.keys()).join(', ')}`,
      );
    }

    return factory(config);
  }

  /**
   * Get all registered provider types.
   * @returns Array of registered provider type names
   */
  static getRegisteredTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}
