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
  description = "GPU accelerator type for Cloud Batch training VMs (e.g. nvidia-l4, nvidia-tesla-a100). Must be compatible with the machine_type in the selected region."
  type        = string
  default     = "nvidia-l4"
}

variable "ml_gpu_count" {
  description = "Number of GPUs attached to each Cloud Batch training VM"
  type        = number
  default     = 1
}

variable "ml_batch_machine_type" {
  description = "Compute Engine machine type for Cloud Batch training VMs (must match ml_gpu_type — e.g. g2-standard-8 pairs with nvidia-l4)"
  type        = string
  default     = "g2-standard-8"
}

variable "ml_batch_boot_disk_gb" {
  description = "Boot disk size in GB for Cloud Batch training VMs"
  type        = number
  default     = 100
}

variable "ml_batch_max_run_seconds" {
  description = "Max runtime per Cloud Batch training task in seconds (Batch allows up to 7 days; default 24h)"
  type        = number
  default     = 86400
}

variable "ml_image" {
  description = "Docker image for the ML training container. Leave empty (default) to use Artifact Registry's :latest tag — each Cloud Batch submission then picks up the most recent Cloud Build output automatically. Set to a pinned :$${SHORT_SHA} URL for reproducible deploys (requires a redeploy of the API when bumping)."
  type        = string
  default     = ""
}

variable "sendgrid_from_email" {
  description = "SendGrid sender email address"
  type        = string
  default     = ""
}

