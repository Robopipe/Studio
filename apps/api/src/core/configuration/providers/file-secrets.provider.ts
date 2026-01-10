import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { load } from 'js-yaml';
import type { SecretsProvider } from './secrets-provider.interface';

export interface FileSecretsProviderConfig {
  type: 'file';
  filename: string;
  baseDir?: string;
  prefix?: string;
}

export class FileSecretsProvider implements SecretsProvider {
  private readonly filePath: string;
  private readonly prefix?: string;
  private readonly cache: Record<string, string> = {};

  constructor(config: FileSecretsProviderConfig) {
    const baseDir = config.baseDir || process.cwd();
    this.filePath = join(baseDir, config.filename);
    this.prefix = config.prefix;
    this.loadFile();
  }

  private loadFile() {
    if (!existsSync(this.filePath)) return;
    const content = readFileSync(this.filePath, 'utf8');
    const data = load(content) as Record<string, any>;
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string') this.cache[k] = v;
      }
    }
  }

  async getSecret(name: string): Promise<string | undefined> {
    const prefixedKey = this.prefix ? `${this.prefix}${name}` : undefined;
    return (prefixedKey && this.cache[prefixedKey]) || this.cache[name];
  }
}
