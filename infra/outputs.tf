output "api_url" {
  description = "Cloud Run API URL"
  value       = module.cloud_run.url
}

output "web_bucket" {
  description = "GCS bucket for web static files"
  value       = module.storage.bucket_name
}

output "web_ip" {
  description = "Load balancer IP for web"
  value       = module.load_balancer.ip_address
}

output "cloud_sql_instance" {
  description = "Cloud SQL instance connection name"
  value       = module.cloud_sql.connection_name
}

output "artifact_registry" {
  description = "Artifact Registry repository"
  value       = module.artifact_registry.repository_id
}

output "ml_job_name" {
  description = "Cloud Run ML job name"
  value       = module.cloud_run_ml.job_name
}
