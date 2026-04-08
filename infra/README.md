# Infrastructure

Terraform-managed GCP infrastructure for Robopipe Studio. Each environment lives in its own GCP project with its own remote state.

| Environment | GCP Project       | State Bucket                    | Branch Trigger |
|-------------|-------------------|---------------------------------|----------------|
| Staging     | `io-robopipe-dev` | `robopipe-dev-terraform-state`  | `dev`          |
| Production  | `io-robopipe`     | `robopipe-terraform-state`      | `release`      |

## Resources Created

- **Artifact Registry** -- Docker repo for API/ML images
- **Cloud SQL** -- PostgreSQL 16 instance + database + user
- **Secrets** -- Secret Manager (DATABASE_URL, JWT, cookie, ML, SendGrid, HubAI)
- **Cloud Run** -- API service with Cloud SQL connection and public access
- **Cloud Run Job** -- ML training job with GPU (nvidia-rtx-pro-6000)
- **Storage** -- GCS buckets for web static files and assets
- **Load Balancer** -- Global IP, CDN, managed SSL certificate
- **Cloud Build** -- CI/CD triggers for API, Web, and ML

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- GCP project with billing enabled

## Working with Environments

Each environment requires two config files in `environments/`:
- `<env>.tfvars` -- resource configuration (project, region, scaling, domains, etc.)
- `<env>.backend.tfvars` -- state backend configuration (GCS bucket)

### Switching Environments

**You must re-init when switching between environments.** Terraform can only work with one backend at a time.

```bash
# Switch to staging
gcloud config set project io-robopipe-dev
terraform init -reconfigure -backend-config=environments/staging.backend.tfvars

# Switch to production
gcloud config set project io-robopipe
terraform init -reconfigure -backend-config=environments/prod.backend.tfvars
```

### Plan and Apply

```bash
# Staging
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars

# Production
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

### Destroy

```bash
# Set deletion_protection = false in the tfvars first
terraform destroy -var-file=environments/<env>.tfvars
```

## Secrets

After first `terraform apply`, some secrets need manual values added:

```bash
echo -n "value" | gcloud secrets versions add <SECRET_NAME> --data-file=- --project=<PROJECT_ID>
```

Secrets that need manual values: `jwtSecret`, `cookieSecret`, `mlSecret`, `hubaiApiKey`, `sendgridApiKey`. The `databaseUrl` is auto-populated by Terraform.

## File Structure

```
infra/
  main.tf                              # Root config, providers, modules, Cloud Build triggers
  variables.tf                         # Input variable definitions
  outputs.tf                           # Output values
  environments/
    staging.tfvars                     # Staging resource config
    staging.backend.tfvars             # Staging state backend
    prod.tfvars                        # Production resource config
    prod.backend.tfvars                # Production state backend
  modules/
    artifact-registry/                 # Docker image registry
    cloud-sql/                         # PostgreSQL database
    cloud-run/                         # API service
    cloud-run-ml/                      # ML training job (GPU)
    secrets/                           # Secret Manager
    storage/                           # GCS buckets
    load-balancer/                     # Global LB + CDN + SSL
```
