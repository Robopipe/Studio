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
  description = "Region for Cloud Batch training jobs (must support the chosen GPU; us-central1 has the widest H100/A100 availability). Independent of var.region — AR, Cloud SQL, Cloud Run, and GCS stay in var.region, only Batch VMs run here."
  type        = string
  default     = "us-central1"
}

variable "ml_gpu_type" {
  description = "Custom GPU accelerator type (N1-style attachment). Leave empty when using accelerator-optimized VMs (A2/A3/G2), which come with a bundled GPU that Batch attaches from the machine type."
  type        = string
  default     = ""
}

variable "ml_gpu_count" {
  description = "Custom GPU count (N1-style attachment). Leave at 0 when using A2/A3/G2 machine types."
  type        = number
  default     = 0
}

variable "ml_batch_machine_type" {
  description = "Compute Engine machine type for Cloud Batch training VMs. Default a2-ultragpu-1g = 12 vCPU, 170 GB RAM, 1× NVIDIA A100 80 GB (GPU bundled, no explicit accelerator needed)."
  type        = string
  default     = "a2-ultragpu-1g"
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

variable "ml_batch_task_cpu_milli" {
  description = "CPU millicores allocated to the training task on the Batch VM. Batch starves tasks to ~2 vCPU if unset. Default 11000 = 11 vCPU, leaving ~1 vCPU for the agent on a2-ultragpu-1g."
  type        = number
  default     = 11000
}

variable "ml_batch_task_memory_mib" {
  description = "Memory (MiB) allocated to the training task on the Batch VM. Default 163840 = 160 GiB, leaving ~10 GiB for the agent/OS on a2-ultragpu-1g (174080 MiB total)."
  type        = number
  default     = 163840
}

variable "ml_batch_shm_size" {
  description = "Size of /dev/shm inside the training container (Docker --shm-size). Required >64 MiB for PyTorch DataLoader workers. Default 16g."
  type        = string
  default     = "16g"
}

variable "ml_image" {
  description = "Docker image for the ML training container. Leave empty (default) to use Artifact Registry's :latest tag — each Cloud Batch submission then picks up the most recent Cloud Build output automatically. Set to a pinned :$${SHORT_SHA} URL for reproducible deploys (requires a redeploy of the API when bumping)."
  type        = string
  default     = ""
}

variable "ml_yolo_image" {
  description = "Docker image for the Ultralytics-backed ML training container (apps/ml-yolo). Dispatched to when a model is created with backend=ULTRALYTICS. Leave empty to default to the :latest tag in AR."
  type        = string
  default     = ""
}

variable "sendgrid_from_email" {
  description = "SendGrid sender email address"
  type        = string
  default     = ""
}

