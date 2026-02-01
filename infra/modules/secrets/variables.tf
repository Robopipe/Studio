variable "project_id" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "cloud_run_sa" {
  description = "Cloud Run service account email for IAM bindings"
  type        = string
}
