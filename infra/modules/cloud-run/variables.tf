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
  description = "Docker image used for Cloud Batch training jobs (LUXONIS backend). If empty the API falls back to ML_HOST (FastAPI dev mode)."
  type        = string
  default     = ""
}

variable "ml_batch_image_yolo" {
  description = "Docker image used for Cloud Batch training jobs (ULTRALYTICS backend). Selected per-model via the `backend` field."
  type        = string
  default     = ""
}

variable "ml_batch_service_account" {
  description = "Email of the service account Cloud Batch training VMs run as"
  type        = string
  default     = ""
}

variable "ml_batch_machine_type" {
  description = "Compute Engine machine type for Cloud Batch training VMs. Default a2-ultragpu-1g bundles 1× A100 80 GB."
  type        = string
  default     = "a2-ultragpu-1g"
}

variable "ml_batch_gpu_type" {
  description = "Custom GPU accelerator type (N1-style attachment only). Leave empty for A2/A3/G2 bundled GPUs."
  type        = string
  default     = ""
}

variable "ml_batch_gpu_count" {
  description = "Custom GPU count (N1-style attachment only). Leave at 0 for A2/A3/G2 bundled GPUs."
  type        = number
  default     = 0
}

variable "ml_batch_boot_disk_image" {
  description = "Custom boot-disk VM image for Cloud Batch training VMs. Empty = default Container-Optimized OS; set to a Deep Learning VM image to skip the GPU driver download."
  type        = string
  default     = ""
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

variable "ml_batch_task_cpu_milli" {
  description = "CPU millicores allocated to the training task on the Batch VM"
  type        = number
  default     = 11000
}

variable "ml_batch_task_memory_mib" {
  description = "Memory (MiB) allocated to the training task on the Batch VM"
  type        = number
  default     = 163840
}

variable "ml_batch_shm_size" {
  description = "Size of /dev/shm inside the training container (Docker --shm-size syntax)"
  type        = string
  default     = "16g"
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

variable "ml_infer_url" {
  description = "Base URL of the apps/ml-infer Cloud Run service (no trailing slash)"
  type        = string
  default     = ""
}

variable "ml_infer_api_key_secret" {
  description = "Secret Manager secret name for the apps/api ↔ apps/ml-infer shared key"
  type        = string
  default     = ""
}
