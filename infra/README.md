
## Resources Created
- artifact-registry — Docker repo for API images                                                                                                      
- cloud-sql — PostgreSQL 16 instance + database + user (auto-generated password)                                                                      
- secrets — Secret Manager for DATABASE_URL, jwt_secret, cookie_secret + IAM for Cloud Run SA                                                         
- cloud-run — API service with Cloud SQL connection, env vars, secrets, public access                                                                 
- storage — GCS bucket for web static files (SPA config)                                                                                              
- load-balancer — Global IP, backend bucket, CDN, optional HTTPS with managed SSL cert           

## Prerequisites
- [Terraform](https://www.terraform.io/downloads) >= 1.0
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- GCP Project with billing enabled

## Quick Start
In `/infra` folder..

1. **Authenticate with GCP**
   ```bash
   gcloud auth application-default login
   ```

2. **Deploy**
   ```bash
   terraform init
   terraform plan
   terraform apply -var-file=environments/staging.tfvars # or environments/prod.tfvars  
   ```

## Destroy

```bash
terraform destroy
```

> ⚠️ Set `database_deletion_protection = false` before destroying if needed.