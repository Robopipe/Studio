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

variable "ml_service_account" {
  description = "ML service account email (used by Cloud Batch training VMs) for IAM bindings"
  type        = string
  default     = ""
}

variable "cloud_build_sa" {
  description = "Cloud Build service account email for IAM bindings"
  type        = string
  default     = ""
}
