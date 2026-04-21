variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "service_account" {
  type = string
}

variable "image" {
  type = string
}

variable "cloud_sql_connection" {
  type = string
}

variable "environment" {
  type = string
}

variable "min_instances" {
  type = number
}

variable "max_instances" {
  type = number
}

variable "secret_ids" {
  description = "Map of secret key to Secret Manager secret ID"
  type        = map(string)
}

variable "web_host" {
  description = "Web frontend URL for CORS"
  type        = string
  default     = ""
}

variable "api_host" {
  description = "API URL for CORS"
  type        = string
  default     = ""
}

variable "ml_region" {
  description = "Region where Cloud Batch training jobs are submitted"
  type        = string
}

variable "ml_batch_image" {
  description = "Docker image used for Cloud Batch training jobs. If empty the API falls back to ML_HOST (FastAPI dev mode)."
  type        = string
  default     = ""
}

variable "ml_batch_service_account" {
  description = "Email of the service account Cloud Batch training VMs run as"
  type        = string
  default     = ""
}

variable "ml_batch_machine_type" {
  description = "Compute Engine machine type for Cloud Batch training VMs"
  type        = string
  default     = "g2-standard-8"
}

variable "ml_batch_gpu_type" {
  description = "GPU accelerator type (e.g. nvidia-l4)"
  type        = string
  default     = "nvidia-l4"
}

variable "ml_batch_gpu_count" {
  description = "Number of GPUs per Cloud Batch training VM"
  type        = number
  default     = 1
}

variable "ml_batch_boot_disk_gb" {
  description = "Boot disk size in GB for Cloud Batch training VMs"
  type        = number
  default     = 100
}

variable "ml_batch_max_run_seconds" {
  description = "Max runtime per Cloud Batch training task in seconds"
  type        = number
  default     = 86400
}

variable "ml_batch_api_key_secret" {
  description = "Secret Manager secret name injected as API_KEY into the training container"
  type        = string
  default     = ""
}

variable "ml_batch_hubai_api_key_secret" {
  description = "Secret Manager secret name injected as HUBAI_API_KEY into the training container"
  type        = string
  default     = ""
}

variable "gcp_project" {
  description = "GCP project ID"
  type        = string
}

variable "bucket_name" {
  description = "GCS assets bucket name"
  type        = string
}

variable "sendgrid_from_email" {
  description = "SendGrid sender email address"
  type        = string
  default     = ""
}
