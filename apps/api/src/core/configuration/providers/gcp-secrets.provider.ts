import type { SecretsProvider } from './secrets-provider.interface';

export interface GcpSecretsProviderConfig {
  type: 'gcp';
  project: string;
  prefix?: string;
  version?: string;
}

export class GcpSecretsProvider implements SecretsProvider {
  private client: any | null = null;
  private readonly project: string;
  private readonly prefix?: string;
  private readonly version: string;

  constructor(config: GcpSecretsProviderConfig) {
    this.project = config.project;
    this.prefix = config.prefix;
    this.version = config.version || 'latest';
    if (!this.project) {
      throw new Error(
        'GCP project is required for GCP secrets provider. Set GCP_PROJECT or CLOUD_PROJECT env var.',
      );
    }
  }

  private async ensureClient() {
    if (!this.client) {
      try {
        const { SecretManagerServiceClient } = await import(
          '@google-cloud/secret-manager'
        );
        this.client = new SecretManagerServiceClient();
      } catch (e) {
        throw new Error(
          'Missing @google-cloud/secret-manager dependency. Install it to use GCP secrets provider.',
        );
      }
    }
  }

  async getSecret(name: string): Promise<string | undefined> {
    await this.ensureClient();
    const fullName = `projects/${this.project}/secrets/${this.prefix ?? ''}${name}/versions/${this.version}`;
    const [secretVersion] = await this.client.accessSecretVersion({
      name: fullName,
    });
    return secretVersion.payload?.data?.toString();
  }
}
