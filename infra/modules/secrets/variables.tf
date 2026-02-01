variable "project_id" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "cloud_run_sa" {
  description = "Cloud Run API service account email for IAM bindings"
  type        = string
}

variable "cloud_run_ml_sa" {
  description = "Cloud Run ML service account email for IAM bindings"
  type        = string
  default     = ""
}
