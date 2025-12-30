# With-NestJs | API

## Getting Started

First, run the development server:

```bash
pnpm run dev
# Also works with NPM, YARN, BUN, ...
```

By default, your server will run at [localhost:3000](http://localhost:3000). You can use your favorite API platform like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/) to test your APIs

You can start editing the demo **APIs** by modifying [linksService](./src/links/links.service.ts) provider.

### Important Note 🚧

If you plan to `build` or `test` the app. Please make sure to build the `packages/*` first.

## Learn More

Learn more about `NestJs` with following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)

## Configuration & Secrets

The configuration module is fully **cloud-agnostic** and **extensible**, located in `src/modules/configuration`.

### Configuration Files

- `config.local.yml` - Used when `APP_ENV=local` (default)
- `config.yml` - Used for other environments
- See `config.example.yml` and `config.local.example.yml` for templates

### Secrets Providers

Secrets can be loaded from multiple sources. Configure via:

1. **YAML Configuration** (recommended):

```yaml
secretsProviderConfig:
  type: env # or 'file', 'gcp', or custom
  prefix: prod_be_
  # ... provider-specific options
```

2. **Environment Variables** (fallback):

- `SECRETS_PROVIDER`: Provider type (`env`, `file`, `gcp`)
- `SECRETS_PREFIX`: Optional prefix for secret names
- `GCP_PROJECT` or `CLOUD_PROJECT`: For GCP provider
- `APP_ENV`: Environment name (`local`, `dev`, `prod`, etc.)

### Built-in Providers

#### Environment Variables (`env`)

```yaml
secretsProviderConfig:
  type: env
  prefix: myapp_ # optional
```

Reads secrets from `process.env`. Tries `{prefix}{secretName}` first, then falls back to `{secretName}`.

#### File-based (`file`)

```yaml
secretsProviderConfig:
  type: file
  filename: secrets.yml
  baseDir: /custom/path # optional, defaults to process.cwd()
  prefix: prod_ # optional
```

Loads secrets from a YAML file. See `secrets.local.example.yml`.

#### Google Cloud Secret Manager (`gcp`)

```yaml
secretsProviderConfig:
  type: gcp
  project: my-gcp-project
  prefix: prod_be_ # optional
  version: latest # optional, defaults to 'latest'
```

Requires `@google-cloud/secret-manager` package installed.

### Custom Providers

Extend the system by registering custom providers:

```typescript
import { SecretsProviderRegistry } from './modules/configuration/providers';

// Register your custom provider
SecretsProviderRegistry.register('aws-secrets-manager', (config) => {
  return new AwsSecretsProvider(config);
});
```

Then use it in your config:

```yaml
secretsProviderConfig:
  type: aws-secrets-manager
  region: us-east-1
  secretPrefix: /myapp/prod/
```

### Usage Example

```yaml
# config.yml
secrets:
  - jwtSecret
  - databaseUrl

secretsProviderConfig:
  type: gcp
  project: my-project
  prefix: prod_

databaseUrl: postgresql://default-db
```

The loader will:

1. Load base config from `config.yml`
2. Create the configured secrets provider
3. Fetch secrets listed in the `secrets` array
4. Merge secrets into the config object
5. Apply environment-specific overrides
6. Validate against the schema
