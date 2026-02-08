variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "europe-west1"
}

variable "environment" {
  description = "Environment name (staging or prod)"
  type        = string
}

variable "domain" {
  description = "Custom domain for the web load balancer (optional)"
  type        = string
  default     = ""
}

variable "api_domain" {
  description = "Custom domain for the API (optional, e.g. api.dev.robopipe.io)"
  type        = string
  default     = ""
}

variable "cloud_sql_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "cloud_sql_deletion_protection" {
  description = "Enable deletion protection for Cloud SQL"
  type        = bool
  default     = true
}

variable "cloud_sql_authorized_networks" {
  description = "List of authorized networks for Cloud SQL access"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "cloud_sql_database_name" {
  description = "Cloud SQL database name"
  type        = string
  default     = "robopipe"
}

variable "cloud_run_image" {
  description = "Docker image for Cloud Run. Leave empty to use a placeholder on first deploy."
  type        = string
  default     = ""
}

variable "cloud_run_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "ml_region" {
  description = "Region for ML service (must support GPUs: us-central1, europe-west4, asia-southeast1)"
  type        = string
  default     = "europe-west4"
}

variable "ml_gpu_type" {
  description = "GPU type for ML service"
  type        = string
  default     = "nvidia-l4"
}

variable "ml_gpu_count" {
  description = "Number of GPUs per ML instance"
  type        = number
  default     = 1
}

variable "ml_memory" {
  description = "Memory for ML service (e.g., 16Gi, 32Gi)"
  type        = string
  default     = "16Gi"
}

variable "ml_cpu" {
  description = "CPU for ML service"
  type        = string
  default     = "4"
}

variable "ml_timeout" {
  description = "ML request timeout in seconds (max 3600)"
  type        = number
  default     = 3600
}

variable "ml_image" {
  description = "Docker image for ML service. Leave empty to use a placeholder on first deploy."
  type        = string
  default     = ""
}

